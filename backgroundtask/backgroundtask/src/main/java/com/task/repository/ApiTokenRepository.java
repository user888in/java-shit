package com.task.repository;

import com.task.entity.ApiToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ApiTokenRepository extends JpaRepository<ApiToken, Long> {
    int deleteByExpiryDateBefore(LocalDateTime date);
}
