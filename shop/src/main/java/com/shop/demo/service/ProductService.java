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
public class ProductService {
    private final ProductRepository productRepository;


    public ProductResponse createProduct(CreateProductRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException("Product name cannot be blank");
        }
        if (request.price() == null || request.price() <= 0) {
            throw new BadRequestException("Price must be greater than zero");
        }
        if (request.stockQuantity() == null || request.stockQuantity() < 0) {
            throw new BadRequestException("Stock cannot be negative");
        }
        if (productRepository.existsByName(request.name())) {
            throw new BadRequestException("Product already exists" + request.name());
        }
        Product product = new Product(request.name(), BigDecimal.valueOf(request.price()), request.stockQuantity());
        return ProductResponse.from(productRepository.save(product));
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("product not found " + id));
        return ProductResponse.from(product);
    }


    public PageResponse<ProductResponse> searchProducts(String search, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock, int page, int size, String sortBy, String sortDir) {
        List<String> allowedSortFields = List.of("name", "price", "stockQuantity");
        if (!allowedSortFields.contains(sortBy)) {
            sortBy = "name"; // default fallback
        }
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        Page<Product> result = productRepository.searchProducts(search, minPrice, maxPrice, inStock, pageable);
        return PageResponse.from(result, ProductResponse::from);
    }

    @Transactional
    public Product reserveStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("product not found" + productId));
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(
                    "Not enough stock for: " + product.getName() + ". Requested: " + quantity + ", Available: " + product.getStockQuantity()
            );
        }
        product.setStockQuantity(product.getStockQuantity() - quantity);
        return productRepository.save(product);
    }

    @Transactional
    public void restoreStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found " + productId));
        product.setStockQuantity(product.getStockQuantity() + quantity);
        productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }
}
