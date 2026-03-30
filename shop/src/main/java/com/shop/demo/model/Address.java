package com.shop.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String pincode;

    private String landmark;

    @Column(nullable = false)
    private boolean isDefault = false;

    public Address(User user, String fullName, String phone, String street, String city, String state, String pincode) {
        this.user = user;
        this.fullName = fullName;
        this.phone = phone;
        this.street = street;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
    }
}
