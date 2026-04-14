package org.example.dao;

import org.example.model.PageRequest;
import org.example.model.PageResponse;
import org.example.model.Product;
import org.example.model.ProductFilter;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO {
    private static final String URL = "jdbc:mysql://127.0.0.1:3306/pagination?autoReconnect=true&useSSL=false";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "Vinay@0011";

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    public PageResponse<Product> getProducts(ProductFilter filter, PageRequest pageRequest) {
        // Dynamically building filter clause
        StringBuilder whereClause = new StringBuilder("where 1 = 1"); // no worry to check whether condition or not

        List<Object> params = new ArrayList<>(); // holds the actual values for each ? placeholder
        if (filter.getName() != null && !filter.getName().isEmpty()) {
            whereClause.append(" and name like ? ");
            params.add("%" + filter.getName() + "%");
        }
        if (filter.getCategory() != null) {
            whereClause.append(" and category = ?");
            params.add(filter.getCategory());
        }
        if (filter.getBrand() != null) {
            whereClause.append(" and brand = ?");
            params.add(filter.getBrand());
        }
        if (filter.getMinPrice() != null) {
            whereClause.append(" and price >= ?");
            params.add(filter.getMinPrice());
        }
        if (filter.getMaxPrice() != null) {
            whereClause.append(" and price <= ?");
            params.add(filter.getMaxPrice());
        }
        if (filter.getInStock() != null) {
            whereClause.append(" and in_stock = ?");
            params.add(filter.getInStock());
        }

        long totalRecords = countRecords(whereClause.toString(), params);
        List<Product> products = fetchPage(whereClause.toString(), params, pageRequest);

        return new PageResponse<>(
                products,
                pageRequest.getPageNumber(),
                pageRequest.getPageSize(),
                totalRecords
        );
    }

    private long countRecords(String whereClause, List<Object> params) {
        String sql = "select count(*) from products " + whereClause;
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            setParameters(preparedStatement, params);
            ResultSet resultSet = preparedStatement.executeQuery();
            if (resultSet.next()) {
                return resultSet.getLong(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    private List<Product> fetchPage(String whereClause, List<Object> params, PageRequest pageRequest) {
        String sql = "select * from products " + whereClause
                + " order by id "
                + " limit ? offset ?";
        List<Product> products = new ArrayList<>();
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            setParameters(preparedStatement, params);
            preparedStatement.setInt(params.size() + 1, pageRequest.getLimit());
            preparedStatement.setInt(params.size() + 2, pageRequest.getOfset());
            ResultSet resultSet = preparedStatement.executeQuery();
            while (resultSet.next()) {
                products.add(mapRow(resultSet));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return products;
    }

    private void setParameters(PreparedStatement preparedStatement, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            preparedStatement.setObject(i + 1, params.get(i)); // figures out the right sql type
        }
    }

    private Product mapRow(ResultSet resultSet) throws SQLException {
        Product product = new Product();
        product.setId(resultSet.getInt("id"));
        product.setName(resultSet.getString("name"));
        product.setCategory(resultSet.getString("category"));
        product.setPrice(resultSet.getDouble("price"));
        product.setBrand(resultSet.getString("brand"));
        product.setInStock(resultSet.getBoolean("in_stock"));
        return product;
    }
}
