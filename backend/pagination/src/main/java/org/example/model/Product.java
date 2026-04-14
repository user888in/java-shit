package org.example.model;

public class Product {
    private int id;
    private String name;
    private String category;
    private double price;
    private String brand;
    private Boolean inStock;
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public boolean isInStock() { return inStock; }
    public void setInStock(boolean inStock) { this.inStock = inStock; }

    @Override
    public String toString() {
        return "Product{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", category='" + category + '\'' +
                ", price=" + price +
                ", brand='" + brand + '\'' +
                ", inStock=" + inStock +
                '}';
    }
}
