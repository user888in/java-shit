package com.linkpulse.analyticsservice.repository;

import com.linkpulse.analyticsservice.entity.ClickEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEventEntity, Long> {

    boolean existsByDedupKey(String dedupKey);

    long countByShortCode(String shortCode);

    @Query("""
           SELECT DATE_TRUNC('day', c.clickedAt) AS day, COUNT(c)
           FROM ClickEventEntity c
           WHERE c.shortCode = :shortCode AND c.clickedAt >= :since
           GROUP BY DATE_TRUNC('day', c.clickedAt)
           ORDER BY day
           """)
    List<Object[]> countClicksByDay(@Param("shortCode") String shortCode, @Param("since") Instant since);

    @Query("""
           SELECT c.referrer, COUNT(c)
           FROM ClickEventEntity c
           WHERE c.shortCode = :shortCode AND c.referrer IS NOT NULL
           GROUP BY c.referrer
           ORDER BY COUNT(c) DESC
           """)
    List<Object[]> topReferrers(@Param("shortCode") String shortCode);
}
