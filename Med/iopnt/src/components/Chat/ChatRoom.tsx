"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIdentity } from "@/context/IdentityContext";
import { Post, Message } from "@/types/post";
import { generateId } from "@/lib/identity";
import { getTimeRemaining } from "@/lib/time";
import { fetchMessages, addMessage as apiAddMessage } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { MessageBubble } from "./MessageBubble";
import styles from "./ChatRoom.module.css";

interface ChatRoomProps {
    post: Post;
    onClose: () => void;
}

export function ChatRoom({ post, onClose }: ChatRoomProps) {
    const { user } = useIdentity();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [chatExpiresAt] = useState(post.createdAt + (12 * 60 * 60 * 1000));
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(chatExpiresAt));
    const [activeUsers, setActiveUsers] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { connected, joinChat, leaveChat, sendMessage, onMessage, onUserJoined, onUserLeft } = useSocket();

    // Load initial messages from API
    useEffect(() => {
        async function loadMessages() {
            const fetchedMessages = await fetchMessages(post.id);
            setMessages(fetchedMessages);
        }
        loadMessages();
    }, [post.id]);

    // Join chat room on mount
    useEffect(() => {
        joinChat(post.id);

        return () => {
            leaveChat(post.id);
        };
    }, [post.id, joinChat, leaveChat]);

    // Listen for real-time messages
    useEffect(() => {
        const unsubscribe = onMessage(({ postId, message }) => {
            if (postId === post.id) {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            }
        });

        return unsubscribe;
    }, [post.id, onMessage]);

    // Listen for user joined/left events
    useEffect(() => {
        const unsubJoined = onUserJoined(({ postId, count }) => {
            if (postId === post.id) {
                setActiveUsers(count);
            }
        });

        const unsubLeft = onUserLeft(({ postId, count }) => {
            if (postId === post.id) {
                setActiveUsers(count);
            }
        });

        return () => {
            unsubJoined();
            unsubLeft();
        };
    }, [post.id, onUserJoined, onUserLeft]);

    // Update timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(getTimeRemaining(chatExpiresAt));
        }, 1000);

        return () => clearInterval(interval);
    }, [chatExpiresAt]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !input.trim()) return;

        const newMessage: Message = {
            id: generateId(),
            postId: post.id,
            authorId: user.id,
            authorName: user.name,
            content: input.trim(),
            createdAt: Date.now(),
        };

        // Clear input immediately
        setInput("");

        // Send via WebSocket (will be received by all clients including this one)
        sendMessage(post.id, newMessage);

        // Also save to backend as fallback
        await apiAddMessage(post.id, newMessage);
    }, [user, input, post.id, sendMessage]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.title}>Chat Room</h2>
                        <div className={styles.expiry}>⏱ Expires in {timeRemaining}</div>
                        {connected && activeUsers > 0 && (
                            <div className={styles.activeUsers}>
                                👥 {activeUsers} active {activeUsers === 1 ? 'user' : 'users'}
                            </div>
                        )}
                    </div>
                    <button className={styles.close} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className={styles.postPreview}>
                    <div className={styles.postAuthor}>{post.authorName}</div>
                    <div className={styles.postContent}>{post.content}</div>
                </div>

                <div className={styles.messages}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyChat}>
                            <div className={styles.emptyIcon}>💬</div>
                            <div>No messages yet. Start the conversation!</div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={message.authorId === user?.id}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className={styles.inputArea} onSubmit={handleSend}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className={styles.sendButton}
                        disabled={!input.trim() || !connected}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
