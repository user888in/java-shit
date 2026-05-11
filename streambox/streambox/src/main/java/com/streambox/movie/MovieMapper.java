package com.streambox.movie;

import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import org.springframework.stereotype.Component;

@Component
public class MovieMapper {
    public Movie toEntity(MovieRequest request) {
        return Movie.builder()
                .title(request.getTitle())
                .genre(request.getGenre())
                .rating(request.getRating())
                .releaseYear(request.getReleaseYear()).build();
    }

    public MovieResponse toResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .genre(movie.getGenre())
                .rating(movie.getRating())
                .releaseYear(movie.getReleaseYear())
                .createdAt(movie.getCreatedAt())
                .updatedAt(movie.getUpdatedAt())
                .build();
    }

}
