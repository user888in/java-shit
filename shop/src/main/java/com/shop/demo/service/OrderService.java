package com.shop.demo.service;

import com.shop.demo.dto.CreateOrderRequest;
import com.shop.demo.dto.OrderItemRequest;
import com.shop.demo.dto.OrderResponse;
import com.shop.demo.dto.PageResponse;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.*;
import com.shop.demo.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, User currentUser) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Order should have at least one item");
        }
        Order order = new Order(currentUser, BigDecimal.ZERO);
        order.setDeliveryAddress(request.deliveryAddress());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            if (itemRequest.quantity() == null || itemRequest.quantity() <= 0) {
                throw new BadRequestException("Quantity should be more than 0");
            }
            Product product = productService.reserveStock(itemRequest.productId(), itemRequest.quantity());
            OrderItem item = new OrderItem(
                    order,
                    product.getId(), product.getName(), product.getPrice(), itemRequest.quantity()
            );
            orderItems.add(item);
            total = total.add(item.getSubtotal());
        }
        order.setTotalPrice(total);
        order.setItems(orderItems);
        // each order will be saved because of CascadeType.ALL
        return OrderResponse.from(orderRepository.save(order));
    }

    public OrderResponse getOrder(Long orderId, User currentUser) {
        Order order = getOrderAndVerifyOwnership(orderId, currentUser.getId());
        return OrderResponse.from(order);
    }

    public PageResponse<OrderResponse> getMyOrders(User currentUser, int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        return PageResponse.from(orderRepository.findByUser_Id(currentUser.getId(), pageable), OrderResponse::from);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, User currentUser) {
        Order order = getOrderAndVerifyOwnership(orderId, currentUser.getId());

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        for (OrderItem item : order.getItems()) {
            productService.restoreStock(item.getProductId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        return OrderResponse.from(order);
    }

    private Order getOrderAndVerifyOwnership(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only access your own orders");
        }

        return order;
    }
}