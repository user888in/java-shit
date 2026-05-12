package com.streambox.movie.dto;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieStatsResponse {
    private Long movieId;
    private Long viewCount;
}
