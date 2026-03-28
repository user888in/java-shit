"use client";

import { useState, useEffect } from "react";
import { Post } from "@/types/post";
import { formatRelativeTime, getTimeRemaining } from "@/lib/time";
import styles from "./PostItem.module.css";

interface PostItemProps {
    post: Post;
    onOpenChat: (postId: string) => void;
}

export function PostItem({ post, onOpenChat }: PostItemProps) {
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(post.expiresAt));
    const [relativeTime, setRelativeTime] = useState(formatRelativeTime(post.createdAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(getTimeRemaining(post.expiresAt));
            setRelativeTime(formatRelativeTime(post.createdAt));
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [post.expiresAt, post.createdAt]);

    // Calculate expiration percentage for visual indicator
    const totalDuration = post.expiresAt - post.createdAt;
    const elapsed = Date.now() - post.createdAt;
    const percentRemaining = Math.max(0, Math.min(100, ((totalDuration - elapsed) / totalDuration) * 100));

    // Determine urgency level
    const isExpiringSoon = percentRemaining < 25;
    const isExpiring = percentRemaining < 10;

    return (
        <div className={`${styles.container} ${isExpiring ? styles.expiring : ''}`}>
            <div className={styles.header}>
                <div className={styles.author}>
                    <div className={styles.avatar}>
                        {post.authorName.charAt(0)}
                    </div>
                    <span className={styles.name}>{post.authorName}</span>
                </div>
                <div className={styles.meta}>
                    <span className={styles.time}>{relativeTime}</span>
                    <span className={`${styles.expiry} ${isExpiringSoon ? styles.expirySoon : ''}`}>
                        ⏱ {timeRemaining}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                <p>{post.content}</p>
                {post.link && (
                    <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        🔗 {post.link}
                    </a>
                )}
            </div>

            <div className={styles.footer}>
                <div className={styles.expiryBar}>
                    <div
                        className={styles.expiryProgress}
                        style={{ width: `${percentRemaining}%` }}
                    />
                </div>
                <button
                    className={styles.chatButton}
                    onClick={() => onOpenChat(post.id)}
                >
                    💬 Open Chat
                </button>
            </div>
        </div>
    );
}
