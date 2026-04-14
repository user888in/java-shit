package org.example.proxy;

import java.util.HashMap;
import java.util.Map;

public class UserServiceProxy implements UserServiceWrapper {
    private UserService realService;
    private Map<Long, String> cache = new HashMap<>();

    public UserServiceProxy(UserService realService) {
        this.realService = realService;
    }

    public String getUser(Long id) {
        if (cache.containsKey(id)) {
            System.out.println("From cache");
            return cache.get(id);
        }
        String result = realService.getUser(id);
        cache.put(id, result);
        return result;
    }

}
