package com.streambox.user;

import com.streambox.exception.ResourceNotFoundException;
import com.streambox.movie.Movie;
import com.streambox.movie.MovieMapper;
import com.streambox.movie.MovieRepository;
import com.streambox.movie.dto.MovieResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WatchlistService {
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final MovieMapper movieMapper;

    public Set<MovieResponse> getWatchlist(Long userId) {
        User user = userRepository.findByIdWithWatchlist(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return user.getWatchlist().stream().map(movieMapper::toResponse).collect(Collectors.toSet());
    }

    @Transactional
    public void addToWatchlist(Long userId, Long movieId) {
        User user = userRepository.findByIdWithWatchlist(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Movie movie = movieRepository.findById(movieId).orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));
        if (user.getWatchlist().contains(movie)) {
            throw new IllegalArgumentException("Movie already in watchlist");
        }
        user.getWatchlist().add(movie);
        log.info("User {} added movie {} to watchlist", userId, movieId);
    }

    @Transactional
    public void removeFromWatchlist(Long userId, Long movieId) {
        User user = userRepository.findByIdWithWatchlist(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));

        if (!user.getWatchlist().contains(movie)) {
            throw new ResourceNotFoundException("Movie not in watchlist");
        }

        user.getWatchlist().remove(movie);
        log.info("User {} removed movie {} from watchlist", userId, movieId);
    }

}
