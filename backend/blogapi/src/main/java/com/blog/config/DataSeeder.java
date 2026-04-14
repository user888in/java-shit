package com.blog.config;

import com.blog.model.Role;
import com.blog.model.User;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j                          // Lombok: gives you log.info(), log.error() etc
public class DataSeeder implements CommandLineRunner {


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User testUser = User.builder()
                    .username("testauthor")
                    .email("mtest@blog.co")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_AUTHOR)
                    .build();

            userRepository.save(testUser);
            log.info("Test user seeded: test@blog.com / password123");
        }
    }
}