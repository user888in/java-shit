package com.shop.demo.service;

import com.shop.demo.dto.*;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.*;
import com.shop.demo.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, User currentUser) {
        log.info("Creating order — userId: {}, items: {}",
                currentUser.getId(), request.items().size());

        Order order = new Order(currentUser, BigDecimal.ZERO);
        order.setDeliveryAddress(request.address());

        AddressResponse snap = AddressResponse.from(request.address());
        order.setDeliveryAddressSnapshot(snap.toSnapshot());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            log.debug("Reserving stock - productId: {}, qty: {}", itemRequest.productId(), itemRequest.quantity());
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
        Order saved = orderRepository.save(order);
        log.info("Order created - orderId: {}, userId: {}, total: {}", saved.getId(), currentUser.getId(), saved.getTotalPrice());
        // each order will be saved because of CascadeType.ALL
        return OrderResponse.from(saved);
    }

    public OrderResponse getOrder(Long orderId, User currentUser) {
        Order order = getOrderAndVerifyOwnership(orderId, currentUser.getId());
        return OrderResponse.from(order);
    }

    public PageResponse<OrderResponse> getMyOrders(User currentUser, int page, int size) {
        log.info("Fetching orders - userId: {}, page: {}", currentUser.getId(), page);
        var pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("createdAt").descending());
        return PageResponse.from(orderRepository.findByUser_Id(currentUser.getId(), pageable), OrderResponse::from);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, User currentUser) {
        log.info("Cancel request — orderId: {}, userId: {}", orderId, currentUser.getId());

        Order order = getOrderAndVerifyOwnership(orderId, currentUser.getId());

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        for (OrderItem item : order.getItems()) {
            log.debug("Restoring stock — productId: {}, qty: {}",
                    item.getProductId(), item.getQuantity());

            productService.restoreStock(item.getProductId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        log.info("Order cancelled — orderId: {}", orderId);

        return OrderResponse.from(order);
    }

    private Order getOrderAndVerifyOwnership(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            log.warn("Unauthorized order access — orderId: {}, userId: {}", orderId, userId);
            throw new BadRequestException("You can only access your own orders");
        }

        return order;
    }
}