package com.shop.demo.service;

import com.shop.demo.dto.CreateProductRequest;
import com.shop.demo.dto.PageResponse;
import com.shop.demo.dto.ProductResponse;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.InsufficientStockException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Product;
import com.shop.demo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryService categoryService;


    public ProductResponse createProduct(CreateProductRequest request) {
        log.info("Creating product — name: {}", request.name());
        if (productRepository.existsByName(request.name())) {
            log.warn("Product already exists — name: {}", request.name());

            throw new BadRequestException("Product already exists" + request.name());
        }

        Product product = new Product(request.name(), BigDecimal.valueOf(request.price()), request.stockQuantity());
        product.setImageUrl(request.imageUrl());
        if (request.categoryId() != null) {
            product.setCategory(categoryService.findCategoryEntityById(request.categoryId()));
        }
        Product saved = productRepository.save(product);
        log.info("Product created — productId: {}, name: {}", saved.getId(), saved.getName());
        return ProductResponse.from(saved);
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("product not found " + id));
        return ProductResponse.from(product);
    }


    public PageResponse<ProductResponse> searchProducts(String search, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock, Long categoryId, int page, int size, String sortBy, String sortDir) {
        log.debug("Searching products — search: {}, category: {}, page: {}",
                search, categoryId, page);
        List<String> allowedSortFields = List.of("name", "price", "stockQuantity");
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "name"; // default fallback
        }
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        Page<Product> result = productRepository.searchProducts(search, minPrice, maxPrice, inStock, categoryId, pageable);
        return PageResponse.from(result, ProductResponse::from);
    }

    @Transactional
    public Product reserveStock(Long productId, Integer quantity) {
        log.debug("Reserving stock — productId: {}, qty: {}", productId, quantity);

        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("product not found" + productId));
        if (product.getStockQuantity() < quantity) {
            log.warn("Insufficient stock — productId: {}, requested: {}, available: {}",
                    productId, quantity, product.getStockQuantity());
            throw new InsufficientStockException(
                    "Not enough stock for: " + product.getName() + ". Requested: " + quantity + ", Available: " + product.getStockQuantity()
            );
        }
        product.setStockQuantity(product.getStockQuantity() - quantity);
        Product saved = productRepository.save(product);
        log.debug("Stock reserved — productId: {}, remaining: {}", productId, saved.getStockQuantity());
        return saved;
    }

    @Transactional
    public void restoreStock(Long productId, Integer quantity) {
        log.debug("Restoring stock — productId: {}, qty: {}", productId, quantity);
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found " + productId));
        product.setStockQuantity(product.getStockQuantity() + quantity);
        productRepository.save(product);
        log.debug("Stock restored — productId: {}, new stock: {}",
                productId, product.getStockQuantity());
    }

    @Transactional
    public void deleteProduct(Long id) {
        log.info("Deleting product — productId: {}", id);

        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
        log.info("Product deleted — productId: {}", id);

    }
}
