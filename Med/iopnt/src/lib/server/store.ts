import { Post, Message } from "@/types/post";

/**
 * DataStore interface - allows easy swap to database later
 */
export interface DataStore {
    // Posts
    getPosts(): Post[];
    getPost(id: string): Post | undefined;
    createPost(post: Post): Post;
    deletePost(id: string): boolean;

    // Messages
    getMessages(postId: string): Message[];
    addMessage(postId: string, message: Message): Message;

    // Cleanup
    cleanup(): void;
}

/**
 * In-memory implementation of DataStore
 * Production: Replace with DatabaseStore
 */
class MemoryStore implements DataStore {
    private posts: Map<string, Post> = new Map();
    private messages: Map<string, Message[]> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startCleanup();
    }

    private startCleanup() {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    cleanup() {
        const now = Date.now();

        // Remove expired posts
        for (const [id, post] of this.posts) {
            if (post.expiresAt < now) {
                this.posts.delete(id);
                this.messages.delete(id);
            }
        }

        // Remove expired chats (12h after post creation)
        for (const [id, post] of this.posts) {
            const chatExpiresAt = post.createdAt + (12 * 60 * 60 * 1000);
            if (chatExpiresAt < now) {
                this.messages.delete(id);
            }
        }
    }

    // Posts
    getPosts(): Post[] {
        const now = Date.now();
        return Array.from(this.posts.values())
            .filter(post => post.expiresAt > now)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    getPost(id: string): Post | undefined {
        const post = this.posts.get(id);
        if (post && post.expiresAt > Date.now()) {
            return post;
        }
        return undefined;
    }

    createPost(post: Post): Post {
        this.posts.set(post.id, post);
        this.messages.set(post.id, []);
        return post;
    }

    deletePost(id: string): boolean {
        const deleted = this.posts.delete(id);
        this.messages.delete(id);
        return deleted;
    }

    // Messages
    getMessages(postId: string): Message[] {
        return this.messages.get(postId) || [];
    }

    addMessage(postId: string, message: Message): Message {
        const messages = this.messages.get(postId) || [];
        messages.push(message);
        this.messages.set(postId, messages);
        return message;
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Singleton instance
let storeInstance: DataStore | null = null;

export function getStore(): DataStore {
    if (!storeInstance) {
        storeInstance = new MemoryStore();
    }
    return storeInstance;
}
