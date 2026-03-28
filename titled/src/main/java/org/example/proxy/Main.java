package org.example.proxy;

import org.example.proxy.UserService;

public class Main {
    public static void main(String[] args) {
        UserService real = new UserService();
        UserServiceProxy proxy = new UserServiceProxy(real);
        proxy.getUser(1L);
        proxy.getUser(1L);
    }
}