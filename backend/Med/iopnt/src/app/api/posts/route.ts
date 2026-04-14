import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export async function GET() {
    try {
        const store = getStore();
        const posts = store.getPosts();

        return NextResponse.json({ posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const post = await request.json();

        // Validate post
        if (!post.id || !post.content || !post.authorId) {
            return NextResponse.json(
                { error: "Invalid post data" },
                { status: 400 }
            );
        }

        const store = getStore();
        const createdPost = store.createPost(post);

        return NextResponse.json({ post: createdPost }, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json(
            { error: "Failed to create post" },
            { status: 500 }
        );
    }
}
