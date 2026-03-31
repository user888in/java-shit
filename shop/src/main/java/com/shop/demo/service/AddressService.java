package com.shop.demo.service;

import com.shop.demo.dto.AddressResponse;
import com.shop.demo.dto.CreateAddressRequest;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Address;
import com.shop.demo.model.User;
import com.shop.demo.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {
    private final AddressRepository addressRepository;

    public List<AddressResponse> getMyAddresses(User user) {
        return addressRepository.findByUser(user).stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse addAddress(CreateAddressRequest request, User user) {
        if (request.isDefault()) {
            addressRepository.findByUserAndIsDefaultTrue(user).ifPresent(existing -> {
                existing.setDefault(false);
                addressRepository.save(existing);
            });
        }
        Address address = new Address(
                user,
                request.fullName(),
                request.phone(),
                request.street(),
                request.city(),
                request.state(),
                request.pincode()
        );
        address.setLandmark(request.landmark());
        address.setDefault(request.isDefault());
        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse setDefault(Long addressId, User user) {
        Address address = getMyAddressAndVerifyOwner(addressId, user);
        addressRepository.findByUserAndIsDefaultTrue(user).ifPresent(existing->{
            existing.setDefault(false);
            addressRepository.save(existing);
        });
        address.setDefault(true);
        return AddressResponse.from(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(Long addressId, User user) {
        Address address = getMyAddressAndVerifyOwner(addressId, user);
        addressRepository.delete(address);
    }

    public Address findAddressEntityById(Long addressId, User user) {
        return getMyAddressAndVerifyOwner(addressId, user);
    }

    private Address getMyAddressAndVerifyOwner(Long addressId, User user){
        Address address = addressRepository.findById(addressId).orElseThrow(() -> new ResourceNotFoundException("address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not your address");
        }
        return address;
    }
}
