package com.otp.model;

import com.otp.enums.OtpChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank(message = "Identifier must not be blank")
    private String identifier;

    @NotBlank(message = "Otp must not be blank")
    @Size(min = 6, max = 6, message = "otp should be exactly 6 digits")
    @Pattern(regexp = "\\d{6}", message = "OTP must contain digits only")
    private String otp;

    @NotNull(message = "Channel must not be null")
    private OtpChannel channel;
}
