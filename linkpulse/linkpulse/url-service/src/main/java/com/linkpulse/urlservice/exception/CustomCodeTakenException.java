package com.linkpulse.urlservice.exception;

public class CustomCodeTakenException extends RuntimeException {
    public CustomCodeTakenException(String code) {
        super("Custom code already in use: " + code);
    }
}
