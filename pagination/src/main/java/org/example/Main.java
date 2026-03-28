package org.example;

import org.example.dao.ProductDAO;
import org.example.model.PageRequest;
import org.example.model.PageResponse;
import org.example.model.Product;
import org.example.model.ProductFilter;

public class Main {

    public static void main(String[] args) {

        ProductDAO dao = new ProductDAO();

        System.out.println("\n========== TEST 1: Simple pagination, no filters ==========");
        ProductFilter noFilter = new ProductFilter.Builder().build();  // all nulls
        PageRequest page1 = new PageRequest(1, 5);  // page 1, 5 per page
        PageResponse<Product> result1 = dao.getProducts(noFilter, page1);
        System.out.println(result1);  // prints page metadata
        result1.getContent().forEach(System.out::println);  // prints each product

        System.out.println("\n========== TEST 2: Filter by category ==========");
        ProductFilter electronicsFilter = new ProductFilter.Builder()
                .category("Electronics")
                .build();
        PageRequest page1of5 = new PageRequest(1, 3);
        PageResponse<Product> result2 = dao.getProducts(electronicsFilter, page1of5);
        System.out.println(result2);
        result2.getContent().forEach(System.out::println);

        System.out.println("\n========== TEST 3: Price range filter ==========");
        ProductFilter priceFilter = new ProductFilter.Builder()
                .minPrice(100.0)
                .maxPrice(500.0)
                .build();
        PageResponse<Product> result3 = dao.getProducts(priceFilter, new PageRequest(1, 5));
        System.out.println(result3);
        result3.getContent().forEach(System.out::println);

        System.out.println("\n========== TEST 4: Multiple filters combined ==========");
        ProductFilter comboFilter = new ProductFilter.Builder()
                .category("Electronics")
                .brand("Apple")
                .inStock(true)
                .minPrice(500.0)
                .build();
        PageResponse<Product> result4 = dao.getProducts(comboFilter, new PageRequest(1, 10));
        System.out.println(result4);
        result4.getContent().forEach(System.out::println);

        System.out.println("\n========== TEST 5: Search by name ==========");
        ProductFilter nameFilter = new ProductFilter.Builder()
                .name("shoe")  // finds "Running Shoes", "Nike Shoes", etc.
                .build();
        PageResponse<Product> result5 = dao.getProducts(nameFilter, new PageRequest(1, 10));
        System.out.println(result5);
        result5.getContent().forEach(System.out::println);

        System.out.println("\n========== TEST 6: Navigate through pages ==========");
        ProductFilter allProducts = new ProductFilter.Builder().build();
        for (int i = 1; i <= 3; i++) {
            PageResponse<Product> page = dao.getProducts(allProducts, new PageRequest(i, 3));
            System.out.println("\n-- Page " + i + " --" + page);
            page.getContent().forEach(System.out::println);
        }
    }
}