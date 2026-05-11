package com.streambox.movie.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class MovieResponse {
    Long id;
    String title;
    String genre;
    Double rating;
    Integer releaseYear;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}
