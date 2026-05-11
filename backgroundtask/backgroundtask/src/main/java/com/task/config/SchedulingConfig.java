package com.task.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4); // jobs to run concurrently
        scheduler.setThreadNamePrefix("task-job");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60); // wait up to 60 seconds for jobs on shutdown
        scheduler.setErrorHandler(t ->
                System.err.println("Unhandled exception in scheduled task: " + t.getMessage()));
        scheduler.initialize();
        return scheduler;
    }
}
