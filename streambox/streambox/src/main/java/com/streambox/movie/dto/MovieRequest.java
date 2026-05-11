package com.streambox.movie.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Value;

@Getter
@Builder
public class MovieRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Genre is required")
    @Size(max = 100, message = "Genre must not exceed 100 characters")
    private String genre;

    @DecimalMin(value = "0.0", message = "Rating must not be at least 0.0")
    @DecimalMax(value = "10.0", message = "Rating must not exceed 10.0")
    Double rating;

    @Min(value = 1888, message = "Release year must be after 1888")
    @Max(value = 2100, message = "Invalid release year")
    Integer releaseYear;
}
