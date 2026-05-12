package com.streambox.movie;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    Page<Movie> findByGenreIgnoreCase(String genre, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE m.rating >= :minRating ORDER BY m.rating DESC")
    Page<Movie> findTopRated(@Param("minRating") Double minRating, Pageable pageable);

    boolean existsByTitleIgnoreCase(String title);

    @Modifying
    @Query("UPDATE Movie m SET m.viewCount = m.viewCount + :count WHERE m.id = :id")
    void incrementViewCount(@Param("id") Long id, @Param("count") Long count);
}
