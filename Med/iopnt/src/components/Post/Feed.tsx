"use client";

import { Post } from "@/types/post";
import { PostItem } from "./PostItem";
import styles from "./Feed.module.css";

interface FeedProps {
    posts: Post[];
    onOpenChat: (postId: string) => void;
}

export function Feed({ posts, onOpenChat }: FeedProps) {
    if (posts.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>👻</div>
                <p className={styles.emptyText}>No posts yet. Be the first to dump your thoughts.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {posts.map((post) => (
                <PostItem key={post.id} post={post} onOpenChat={onOpenChat} />
            ))}
        </div>
    );
}
