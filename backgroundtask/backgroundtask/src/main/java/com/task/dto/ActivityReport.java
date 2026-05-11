package com.task.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ActivityReport {
    private LocalDate date;
    private int loginCount;
    private int newRegistrations;
    private int activeUsers;

    public ActivityReport(LocalDate date, int loginCount, int newRegistrations, int activeUsers) {
        this.date = date;
        this.loginCount = loginCount;
        this.newRegistrations = newRegistrations;
        this.activeUsers = activeUsers;
    }
}
