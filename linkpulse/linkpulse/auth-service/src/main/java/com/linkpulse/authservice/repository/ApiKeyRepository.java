package com.linkpulse.authservice.repository;

import com.linkpulse.authservice.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByKeyPrefixAndRevokedFalse(String keyPrefix);
    List<ApiKey> findByUserId(Long userId);
}
