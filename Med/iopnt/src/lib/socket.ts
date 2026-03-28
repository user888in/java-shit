"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "@/types/post";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io({
            path: "/socket.io",
            transports: ["websocket", "polling"],
        });
    }
    return socket;
}

export interface UseSocketReturn {
    socket: Socket;
    connected: boolean;
    joinChat: (postId: string) => void;
    leaveChat: (postId: string) => void;
    sendMessage: (postId: string, message: Message) => void;
    onMessage: (callback: (data: { postId: string; message: Message }) => void) => () => void;
    onUserJoined: (callback: (data: { postId: string; count: number }) => void) => () => void;
    onUserLeft: (callback: (data: { postId: string; count: number }) => void) => () => void;
}

export function useSocket(): UseSocketReturn {
    const [connected, setConnected] = useState(false);
    const socket = getSocket();

    useEffect(() => {
        const handleConnect = () => {
            console.log("Socket connected");
            setConnected(true);
        };

        const handleDisconnect = () => {
            console.log("Socket disconnected");
            setConnected(false);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        // Check if already connected
        if (socket.connected) {
            setConnected(true);
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
        };
    }, [socket]);

    const joinChat = useCallback((postId: string) => {
        socket.emit("join-chat", { postId });
    }, [socket]);

    const leaveChat = useCallback((postId: string) => {
        socket.emit("leave-chat", { postId });
    }, [socket]);

    const sendMessage = useCallback((postId: string, message: Message) => {
        socket.emit("send-message", { postId, message });
    }, [socket]);

    const onMessage = useCallback((callback: (data: { postId: string; message: Message }) => void) => {
        socket.on("message-received", callback);
        return () => {
            socket.off("message-received", callback);
        };
    }, [socket]);

    const onUserJoined = useCallback((callback: (data: { postId: string; count: number }) => void) => {
        socket.on("user-joined", callback);
        return () => {
            socket.off("user-joined", callback);
        };
    }, [socket]);

    const onUserLeft = useCallback((callback: (data: { postId: string; count: number }) => void) => {
        socket.on("user-left", callback);
        return () => {
            socket.off("user-left", callback);
        };
    }, [socket]);

    return {
        socket,
        connected,
        joinChat,
        leaveChat,
        sendMessage,
        onMessage,
        onUserJoined,
        onUserLeft,
    };
}
