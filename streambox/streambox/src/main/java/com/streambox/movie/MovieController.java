package com.streambox.movie;

import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {
    private final MovieService movieService;

    @GetMapping()
    public Page<MovieResponse> getAll(@PageableDefault(size = 20, sort = "title") Pageable pageable) {
        return movieService.getAllMovies(pageable);
    }

    @GetMapping("/{id}")
    public MovieResponse getById(@PathVariable Long id) {
        return movieService.getMovieById(id);
    }

    @GetMapping("/genre/{genre}")
    public Page<MovieResponse> getByGenre(@PathVariable String genre, @PageableDefault(size = 20) Pageable pageable) {
        return movieService.getByGenre(genre, pageable);
    }

    @GetMapping("/top-rated")
    public Page<MovieResponse> getTopRated(@RequestParam(defaultValue = "7.0") Double minRating, @PageableDefault(size = 20) Pageable pageable) {
        return movieService.getTopRated(minRating, pageable);
    }

    @PostMapping()
    @ResponseStatus(HttpStatus.CREATED)
    public MovieResponse create(@Valid @RequestBody MovieRequest request) {
        return movieService.create(request);
    }

    @PutMapping("/{id}")
    public MovieResponse update(@PathVariable Long id, @Valid @RequestBody MovieRequest request) {
        return movieService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        movieService.delete(id);
    }
}
