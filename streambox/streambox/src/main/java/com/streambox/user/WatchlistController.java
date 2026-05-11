package com.streambox.user;

import com.streambox.movie.dto.MovieResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {
    private final WatchlistService watchlistService;

    @GetMapping
    public Set<MovieResponse> getWatchlist(@AuthenticationPrincipal User currentUser) {
        return watchlistService.getWatchlist(currentUser.getId());
    }

    @PostMapping("/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addToWatchlist(@AuthenticationPrincipal User currentUser, @PathVariable Long movieId) {
        watchlistService.addToWatchlist(currentUser.getId(), movieId);
    }

    @DeleteMapping("{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromWatchlist(@AuthenticationPrincipal User currentUser, @PathVariable Long movieId) {
        watchlistService.removeFromWatchlist(currentUser.getId(), movieId);

    }
}
