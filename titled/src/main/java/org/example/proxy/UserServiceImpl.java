package org.example.proxy;

public class UserServiceImpl implements UserServiceWrapper {
    @Override
    public String getUser(Long id) {
        System.out.println("From db");
        return "User-" + id;
    }
}
