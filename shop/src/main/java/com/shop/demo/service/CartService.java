package com.shop.demo.service;

import com.shop.demo.dto.*;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Cart;
import com.shop.demo.model.CartItem;
import com.shop.demo.model.Product;
import com.shop.demo.model.User;
import com.shop.demo.repository.CartItemRepository;
import com.shop.demo.repository.CartRepository;
import com.shop.demo.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderService orderService;

    // get or create cart
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user).orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    public CartResponse getCart(User user) {
        Cart cart = getOrCreateCart(user);
        return CartResponse.from(cart);
    }

    @Transactional
    public CartResponse addToCart(AddToCartRequest request, User user) {
        if (request.quantity() == null || request.quantity() <= 0) {
            throw new BadRequestException("Quantity should be more than zero");
        }
        Product product = productRepository.findById(request.productId()).orElseThrow(() -> new ResourceNotFoundException("no product found with the id : " + request.productId()));
        if (product.getStockQuantity() < request.quantity()) {
            throw new BadRequestException("not enough stock");
        }
        Cart cart = getOrCreateCart(user);
        var existingItem = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId());
        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.quantity());
        } else {
            cart.getItems().add(new CartItem(cart, product, request.quantity()));
        }
        return CartResponse.from(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateQuantity(Long cartItemId, Integer quantity, User user) {
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new ResourceNotFoundException("no item found"));
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("you cannot change other's cart's item's quantity");
        }
        if (quantity <= 0) {
            item.getCart().getItems().remove(item);
            cartItemRepository.delete(item);
        }else{
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return CartResponse.from(getOrCreateCart(user));
    }

    @Transactional
    public CartResponse removeItem(Long cartItemId, User user) {
        CartItem item = cartItemRepository.findById(cartItemId).orElseThrow(() -> new ResourceNotFoundException("no item found"));
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("you cannot remove items from other's cart");
        }
        Cart cart = item.getCart();
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        return CartResponse.from(cart);
    }

    @Transactional
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    @Transactional
    public OrderResponse checkout(String deliveryAddress, User user) {
        Cart cart = getOrCreateCart(user);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("No items to proceed checkout");
        }
        List<OrderItemRequest> orderItems = cart.getItems().stream().map(item -> new OrderItemRequest(
                item.getProduct().getId(),
                item.getQuantity()
        )).toList();
        // delegate it to order service
        CreateOrderRequest orderRequest = new CreateOrderRequest(orderItems, deliveryAddress);
        OrderResponse order = orderService.createOrder(orderRequest, user);
        // clearing cart after creating order
        clearCart(user);
        return order;
    }
}
