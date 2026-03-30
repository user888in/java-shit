package com.shop.demo.repository;

import com.shop.demo.model.Product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByName(String name);

    boolean existsByName(String name);

    @Query("""
            select p from Product p 
            where (:search is null or lower(p.name) like lower(concat('%',:search, '%'))) 
            and (:minPrice is null or p.price >= :minPrice) 
            and (:maxPrice is null or p.price <= :maxPrice) 
            and (:inStock is null or (:inStock = true and p.stockQuantity > 0))
            and (:categoryId is null or p.category.id = :categoryId)
            """)
    Page<Product> searchProducts(
            @Param("search") String search,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );
}
