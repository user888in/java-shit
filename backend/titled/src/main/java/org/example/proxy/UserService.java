package org.example.proxy;

import java.util.HashMap;
import java.util.Map;

public class UserService {
    private Map<Long, String> cache = new HashMap<>();

    public String getUser(Long id) {
        if (cache.containsKey(id)) {
            System.out.println("From cache...");
            return cache.get(id);
        }
        System.out.println("From db");
        String user = "User-" + id;
        cache.put(id, user);
        return user;
    }
}
