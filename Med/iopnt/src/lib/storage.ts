import { Post, Message } from "@/types/post";

const POSTS_KEY = "ephemeral_posts";
const MESSAGES_KEY = "ephemeral_messages";

export function savePosts(posts: Post[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function loadPosts(): Post[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(POSTS_KEY);
    if (!stored) return [];

    try {
        const posts = JSON.parse(stored) as Post[];
        // Filter out expired posts
        const now = Date.now();
        const validPosts = posts.filter(post => post.expiresAt > now);

        // Update storage if we filtered any
        if (validPosts.length !== posts.length) {
            savePosts(validPosts);
        }

        return validPosts;
    } catch {
        return [];
    }
}

export function saveMessages(postId: string, messages: Message[]): void {
    if (typeof window === "undefined") return;

    const allMessages = loadAllMessages();
    allMessages[postId] = messages;
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
}

export function loadMessages(postId: string): Message[] {
    if (typeof window === "undefined") return [];

    const allMessages = loadAllMessages();
    return allMessages[postId] || [];
}

function loadAllMessages(): Record<string, Message[]> {
    if (typeof window === "undefined") return {};

    const stored = localStorage.getItem(MESSAGES_KEY);
    if (!stored) return {};

    try {
        return JSON.parse(stored);
    } catch {
        return {};
    }
}

export function clearExpiredData(): void {
    if (typeof window === "undefined") return;

    const posts = loadPosts();
    const now = Date.now();

    // Remove expired posts
    const validPosts = posts.filter(post => post.expiresAt > now);
    savePosts(validPosts);

    // Remove messages for expired chats (12 hours after post creation)
    const allMessages = loadAllMessages();
    const validMessages: Record<string, Message[]> = {};

    validPosts.forEach(post => {
        const chatExpiresAt = post.createdAt + (12 * 60 * 60 * 1000);
        if (chatExpiresAt > now && allMessages[post.id]) {
            validMessages[post.id] = allMessages[post.id];
        }
    });

    localStorage.setItem(MESSAGES_KEY, JSON.stringify(validMessages));
}
