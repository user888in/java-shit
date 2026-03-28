package com.shop.demo.repository;

import com.shop.demo.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUser_IdAndProduct_Id(Long userId, Long productId);

    List<Review> findByProduct_Id(Long productId);
}
