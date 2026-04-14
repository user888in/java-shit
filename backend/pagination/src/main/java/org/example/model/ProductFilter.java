package org.example.model;

public class ProductFilter {
    private String name;
    private String category;
    private String brand;
    private Double minPrice;
    private Double maxPrice;
    private Boolean inStock;

    public static class Builder {
        private ProductFilter filter = new ProductFilter();

        public Builder name(String name) {
            filter.name = name;
            return this; // it makes chaining possible
        }

        public Builder category(String category) {
            filter.category = category;
            return this;
        }

        public Builder brand(String brand) {
            filter.brand = brand;
            return this;
        }

        public Builder minPrice(Double minPrice) {
            filter.minPrice = minPrice;
            return this;
        }

        public Builder maxPrice(Double maxPrice) {
            filter.maxPrice = maxPrice;
            return this;
        }

        public Builder inStock(Boolean inStock) {
            filter.inStock = inStock;
            return this;
        }

        public ProductFilter build() {
            return filter; // the complete filter obj
        }
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getBrand() {
        return brand;
    }

    public Double getMinPrice() {
        return minPrice;
    }

    public Double getMaxPrice() {
        return maxPrice;
    }

    public Boolean getInStock() {
        return inStock;
    }

}
