package com.sse.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationEvent {
    private String userId;
    private String type;
    private String message;
    private long timestamp;
    public static NotificationEvent of(String userId, String type,String message){
        return new NotificationEvent(userId, type, message, System.currentTimeMillis());
    }
}
