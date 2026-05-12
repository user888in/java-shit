package com.streambox.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopics {
    public static final String MOVIE_WATCHED = "movie.watched";
    public static final String USER_REGISTERED = "user.registered";
    @Bean
    public NewTopic movieWatchedTopic() {
        return TopicBuilder.name(MOVIE_WATCHED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic userRegisteredTopic() {
        return TopicBuilder.name(USER_REGISTERED).partitions(1).replicas(1).build();
    }
}
