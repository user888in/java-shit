package com.streambox.movie;

import com.streambox.common.PageResponse;
import com.streambox.config.CacheNames;
import com.streambox.exception.ResourceNotFoundException;
import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import com.streambox.movie.dto.MovieStatsResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MovieService {
    private final MovieRepository movieRepository;
    private final MovieMapper movieMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getAllMoviesFallback")
    @Cacheable(value = CacheNames.MOVIES, key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort")
    public PageResponse<MovieResponse> getAllMovies(Pageable pageable) {
        log.debug("Cache MISS — fetching all movies from DB");
        return PageResponse.from(movieRepository.findAll(pageable).map(movieMapper::toResponse));
    }

    public PageResponse<MovieResponse> getAllMoviesFallback(Pageable pageable, Throwable ex) {
        log.warn("Redis circuit open - serving getAllMovies from DB directly. reason ={} ", ex.getMessage());
        return PageResponse.from(movieRepository.findAll(pageable).map(movieMapper::toResponse));
    }

    @CircuitBreaker(name = "redis-cache",fallbackMethod = "getMovieByIdFallback")
    @Cacheable(value = CacheNames.MOVIE, key = "#id")
    public MovieResponse getMovieById(Long id) {
        log.debug("Cache MISS — fetching movie {} from DB", id);
        return movieRepository.findById(id).map(movieMapper::toResponse).orElseThrow(() -> new ResourceNotFoundException("Movie", id));
    }

    public MovieResponse getMovieByIdFallback(Long id, Throwable ex) {
        log.warn("Redis circuit open — serving getById from DB. movieId={} reason={}", id, ex.getMessage());
        return movieRepository.findById(id).map(movieMapper::toResponse).orElseThrow(() -> new ResourceNotFoundException("Movie", id));
    }

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getByGenreFallback")
    @Cacheable(value = CacheNames.MOVIES,
            key = "#genre + '-' + #pageable.pageNumber")
    public PageResponse<MovieResponse> getByGenre(String genre, Pageable pageable) {
        log.debug("Cache MISS — fetching genre {} from DB", genre);
        return PageResponse.from(
                movieRepository.findByGenreIgnoreCase(genre, pageable).map(movieMapper::toResponse)
        );
    }

    public PageResponse<MovieResponse> getByGenreFallback(String genre, Pageable pageable, Throwable ex) {
        log.warn("Redis circuit open — serving getByGenre from DB. genre={} reason={}", genre, ex.getMessage());
        return PageResponse.from(
                movieRepository.findByGenreIgnoreCase(genre, pageable).map(movieMapper::toResponse)
        );
    }

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getTopRatedFallback")
    @Cacheable(value = CacheNames.TOP_RATED, key = "#minRating + '-' + #pageable.pageNumber")
    public PageResponse<MovieResponse> getTopRated(Double minRating, Pageable pageable) {
        log.debug("Cache MISS — fetching top rated from DB");
        return PageResponse.from(movieRepository.findTopRated(minRating, pageable).map(movieMapper::toResponse));
    }

    public PageResponse<MovieResponse> getTopRatedFallback(Double minRating, Pageable pageable, Throwable ex) {
        log.warn("Redis circuit open — serving topRated from DB. reason={}", ex.getMessage());
        return PageResponse.from(movieRepository.findTopRated(minRating, pageable).map(movieMapper::toResponse));
    }

    @Transactional
    @Retry(name = "db-retry")
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIES, allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public MovieResponse create(MovieRequest request) {
        if (movieRepository.existsByTitleIgnoreCase(request.getTitle())) {
            throw new IllegalArgumentException("Movie already exists: " + request.getTitle());
        }
        Movie saved = movieRepository.save(movieMapper.toEntity(request));
        log.info("Created movie id={} — evicted movies + top-rated cache", saved.getId());
        return movieMapper.toResponse(saved);
    }


    @Transactional
    @Retry(name = "db-retry")
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIE, key = "#id"),
            @CacheEvict(value = CacheNames.MOVIES, allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public MovieResponse update(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));

        movie.setTitle(request.getTitle());
        movie.setGenre(request.getGenre());
        movie.setRating(request.getRating());
        movie.setReleaseYear(request.getReleaseYear());

        log.info("Updated movie id={} — evicted all related caches", id);
        return movieMapper.toResponse(movie);   // no save() needed — JPA dirty checking
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIE, key = "#id"),
            @CacheEvict(value = CacheNames.MOVIES, allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public void delete(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie", id);
        }
        movieRepository.deleteById(id);
        log.info("Deleted movie id={} — evicted all related caches", id);
    }

    public MovieStatsResponse getStats(Long movieId) {
        long redisCount = 0L;
        try {
            Object count = redisTemplate.opsForValue().get("movie:views:" + movieId);
            if (count != null) {
                redisCount = Long.parseLong(count.toString());
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable for stats lookup. movieId={} reason={}", movieId, ex.getMessage());
        }

        long dbCount = movieRepository.findById(movieId)
                .map(Movie::getViewCount)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));

        return MovieStatsResponse.builder()
                .movieId(movieId)
                .viewCount(dbCount + redisCount)
                .build();
    }
}
