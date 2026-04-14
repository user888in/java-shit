"use client";

import { useState } from "react";
import { useIdentity } from "@/context/IdentityContext";
import { generateId } from "@/lib/identity";
import { Post } from "@/types/post";
import styles from "./PostComposer.module.css";

interface PostComposerProps {
    onPost: (post: Post) => void;
}

export function PostComposer({ onPost }: PostComposerProps) {
    const { user } = useIdentity();
    const [content, setContent] = useState("");
    const [link, setLink] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !content.trim()) return;

        const now = Date.now();
        const newPost: Post = {
            id: generateId(),
            authorId: user.id,
            authorName: user.name,
            content: content.trim(),
            createdAt: now,
            expiresAt: now + (48 * 60 * 60 * 1000), // 48 hours
            type: link ? "link" : "text",
            link: link || undefined,
        };

        onPost(newPost);
        setContent("");
        setLink("");
        setIsExpanded(false);
    };

    return (
        <div className={`${styles.container} glass`}>
            <form onSubmit={handleSubmit}>
                <textarea
                    className={styles.textarea}
                    placeholder="Dump your thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    rows={isExpanded ? 4 : 2}
                />

                {isExpanded && (
                    <div className={styles.expanded}>
                        <input
                            type="url"
                            className={styles.linkInput}
                            placeholder="Optional link"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                        <div className={styles.actions}>
                            <span className={styles.hint}>Expires in 48h</span>
                            <div className={styles.buttons}>
                                <button
                                    type="button"
                                    className={styles.cancel}
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setContent("");
                                        setLink("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submit}
                                    disabled={!content.trim()}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
