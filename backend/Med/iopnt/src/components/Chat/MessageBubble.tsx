"use client";

import { Message } from "@/types/post";
import { formatRelativeTime } from "@/lib/time";
import styles from "./MessageBubble.module.css";

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
    return (
        <div className={`${styles.container} ${isOwnMessage ? styles.own : styles.other}`}>
            <div className={styles.bubble}>
                {!isOwnMessage && (
                    <div className={styles.author}>{message.authorName}</div>
                )}
                <div className={styles.content}>{message.content}</div>
                <div className={styles.time}>{formatRelativeTime(message.createdAt)}</div>
            </div>
        </div>
    );
}
