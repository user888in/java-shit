package com.otp.service;

import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {
    @Value("${twilio.phone-number}")
    private String fromPhoneNumber;

    @Value("${app.name:MyApp}")
    private String appName;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Async
    public void sendOtpSms(String toPhoneNumber, String otp) {
        try {
            validatePhoneNumber(toPhoneNumber);
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(fromPhoneNumber),
                    buildSmsBody(otp)
            ).create();
            log.info("SMS sent to {} | SID: {} | Status: {}",
                    mask(toPhoneNumber),
                    message.getSid(),
                    message.getStatus());
            if (message.getStatus() == Message.Status.FAILED) {
                log.error("SMS delivery failed for {} | Error: {}",
                        mask(toPhoneNumber),
                        message.getErrorMessage());
                throw new RuntimeException("SMS delivery failed: " + message.getErrorMessage());
            }
        } catch (ApiException e) {
            log.error("Twilio API error sending SMS to {} | Code: {} | Message: {}",
                    mask(toPhoneNumber),
                    e.getCode(),
                    e.getMessage());
            throw new RuntimeException("SMS delivery failed", e);
        }
    }

    private String buildSmsBody(String otp) {
        return String.format("%s: Your verification code is %s."
                + "Valid for %d minutes. Do not share it with anyone.", appName, otp, expiryMinutes);
    }

    private void validatePhoneNumber(String phone) {
        if (!phone.matches("^\\+[1-9]\\d{7,14}$")) {
            throw new IllegalArgumentException(
                    "Phone number must be in E.164 format: +" + phone
            );
        }
    }

    private String mask(String phone) {
        // "+919876543210" → "+91987***10"
        if (phone.length() < 6) return "***";
        return phone.substring(0, 5) + "***" + phone.substring(phone.length() - 2);
    }
}
