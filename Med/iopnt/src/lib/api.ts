import { Post, Message } from "@/types/post";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchPosts(): Promise<Post[]> {
    try {
        const response = await fetch(`${API_BASE}/api/posts`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        return data.posts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

export async function createPost(post: Post): Promise<Post | null> {
    try {
        const response = await fetch(`${API_BASE}/api/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(post),
        });

        if (!response.ok) throw new Error("Failed to create post");
        const data = await response.json();
        return data.post;
    } catch (error) {
        console.error("Error creating post:", error);
        return null;
    }
}

export async function fetchMessages(postId: string): Promise<Message[]> {
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/messages`);
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        return data.messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

export async function addMessage(postId: string, message: Message): Promise<Message | null> {
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });

        if (!response.ok) throw new Error("Failed to add message");
        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error("Error adding message:", error);
        return null;
    }
}
