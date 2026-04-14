export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: number;
    expiresAt: number;
    type: "text" | "link";
    link?: string;
}

export interface Message {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: number;
}
