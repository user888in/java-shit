package com.linkpulse.urlservice.service;

import org.springframework.stereotype.Component;

/**
 * Encodes a Long into a short Base62 string (0-9, a-z, A-Z).
 * Why Base62 over Base64: URL-safe by default, no +, /, or = characters
 * that need escaping in a path segment.
 */
@Component
public class Base62Encoder {

    private static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = ALPHABET.length();

    public String encode(long value) {
        if (value == 0) {
            return String.valueOf(ALPHABET.charAt(0));
        }
        StringBuilder sb = new StringBuilder();
        while (value > 0) {
            int remainder = (int) (value % BASE);
            sb.append(ALPHABET.charAt(remainder));
            value /= BASE;
        }
        return sb.reverse().toString();
    }
}
