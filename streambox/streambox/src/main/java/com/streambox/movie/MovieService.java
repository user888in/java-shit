package com.streambox.movie;

import com.streambox.exception.ResourceNotFoundException;
import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public Page<MovieResponse> getAllMovies(Pageable pageable) {
        log.debug("Fetching all the movies, page: {}", pageable.getPageNumber());
        return movieRepository.findAll(pageable).map(movieMapper::toResponse);
    }

    public MovieResponse getMovieById(Long id) {
        return movieRepository.findById(id).map(movieMapper::toResponse).orElseThrow(() -> new ResourceNotFoundException("Movie", id));
    }

    public Page<MovieResponse> getByGenre(String genre, Pageable pageable) {
        return movieRepository.findByGenreIgnoreCase(genre, pageable).map(movieMapper::toResponse);
    }

    public Page<MovieResponse> getTopRated(Double minRating, Pageable pageable) {
        return movieRepository.findTopRated(minRating, pageable).map(movieMapper::toResponse);
    }

    @Transactional
    public MovieResponse create(MovieRequest request) {
        if (movieRepository.existsByTitleIgnoreCase(request.getTitle())) {
            throw new IllegalArgumentException("Movie already exists: " + request.getTitle());
        }
        Movie saved = movieRepository.save(movieMapper.toEntity(request));
        log.info("Created movie: id={}, title={}", saved.getId(), saved.getTitle());
        return movieMapper.toResponse(saved);
    }

    @Transactional
    public MovieResponse update(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));

        movie.setTitle(request.getTitle());
        movie.setGenre(request.getGenre());
        movie.setRating(request.getRating());
        movie.setReleaseYear(request.getReleaseYear());

        log.info("Updated movie: id={}", id);
        return movieMapper.toResponse(movie);   // no save() needed — JPA dirty checking
    }

    @Transactional
    public void delete(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie", id);
        }
        movieRepository.deleteById(id);
        log.info("Deleted movie: id={}", id);
    }
}
