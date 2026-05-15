package com.otp.model;

import com.otp.enums.OtpChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OtpRequest {
    @NotBlank(message = "identifier must not be blank")
    private String identifier;

    @NotNull(message = "channel must not be null")
    private OtpChannel channel;

}
