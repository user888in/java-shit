package com.otp.controller;

import com.otp.model.OtpRequest;
import com.otp.model.OtpResponse;
import com.otp.model.OtpVerifyRequest;
import com.otp.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/otp")
@RequiredArgsConstructor
@Slf4j
public class OtpController {
    private final OtpService otpService;

    @PostMapping("/send")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request);
        return ResponseEntity.ok(OtpResponse.builder().message("OTP sent to your " +
                request.getChannel().name().toLowerCase()).attemptsRemaining(0).build());
    }

    @PostMapping("/verify")
    public ResponseEntity<OtpResponse> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request) {

        int attemptsRemaining = otpService.verifyOtp(request);

        return ResponseEntity.ok(
                OtpResponse.builder()
                        .success(true)
                        .message("OTP verified successfully")
                        .attemptsRemaining(attemptsRemaining)
                        .build()
        );
    }

    @PostMapping("/resend")
    public ResponseEntity<OtpResponse> resendOtp(
            @Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request);

        return ResponseEntity.ok(
                OtpResponse.builder()
                        .success(true)
                        .message("OTP resent to your " +
                                request.getChannel().name().toLowerCase())
                        .attemptsRemaining(0)
                        .build()
        );
    }
}
