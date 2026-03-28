import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const store = getStore();
        const messages = store.getMessages(params.id);

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const message = await request.json();

        // Validate message
        if (!message.id || !message.content || !message.authorId) {
            return NextResponse.json(
                { error: "Invalid message data" },
                { status: 400 }
            );
        }

        const store = getStore();
        const createdMessage = store.addMessage(params.id, message);

        return NextResponse.json({ message: createdMessage }, { status: 201 });
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Failed to create message" },
            { status: 500 }
        );
    }
}
