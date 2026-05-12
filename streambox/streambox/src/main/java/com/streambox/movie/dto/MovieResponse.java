package com.streambox.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)   // ← add this
public class MovieResponse {
    Long id;
    String title;
    String genre;
    Double rating;
    Integer releaseYear;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

}
