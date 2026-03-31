package com.shop.demo.service;

import com.shop.demo.dto.CategoryResponse;
import com.shop.demo.dto.CreateCategoryRequest;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Category;
import com.shop.demo.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse getCategory(Long id) {
        return CategoryResponse.from(categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found")));
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new BadRequestException("Category Already exists" + request.name());
        }
        Category category = new Category(request.name(), request.description());
        category.setImageUrl(request.imageUrl());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("No category exists with the id " + id));
        category.setName(request.name());
        category.setDescription(request.description());
        category.setImageUrl(request.imageUrl());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new BadRequestException("No category found with the id " + id);
        }
        categoryRepository.deleteById(id);
    }

    public Category findCategoryEntityById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
