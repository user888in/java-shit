package com.shop.demo.repository;

import com.shop.demo.model.Order;
import com.shop.demo.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"user", "items"}) // fetching user + items together to avoid n+1 issue
    Page<Order> findByUser_Id(Long userId, Pageable pageable);
    @EntityGraph(attributePaths = {"user", "items"})
    Optional<Order> findById(Long id);
    @EntityGraph(attributePaths = {"user", "items"})
    Page<Order> findAll(Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findByUser_IdAndStatus(Long userId, OrderStatus status, Pageable pageable);
}
