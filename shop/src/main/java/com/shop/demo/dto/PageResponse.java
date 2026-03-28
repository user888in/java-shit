package com.shop.demo.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T> (
        List<T> content,
        int page,
        int size,
        int totalElements,
        int totalPages,
        boolean last
) {
    public static <E, D>  PageResponse<D> from(Page<E> page, Function<E, D> mapper){
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                (int) page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
