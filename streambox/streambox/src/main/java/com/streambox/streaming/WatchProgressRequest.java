package com.streambox.streaming;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchProgressRequest {
    @NotNull
    @Min(0)
    private Integer progressSeconds;
    @NotNull
    private Boolean completed;

}
