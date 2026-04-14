const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory store (simple implementation for the server)
const posts = new Map();
const messages = new Map();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.io
    const io = new Server(httpServer, {
        cors: {
            origin: dev ? 'http://localhost:3000' : false,
            methods: ['GET', 'POST']
        }
    });

    // Track active users per chat room
    const activeUsers = new Map();

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a chat room
        socket.on('join-chat', ({ postId }) => {
            socket.join(`chat:${postId}`);

            // Track active users
            if (!activeUsers.has(postId)) {
                activeUsers.set(postId, new Set());
            }
            activeUsers.get(postId).add(socket.id);

            const count = activeUsers.get(postId).size;

            // Notify room of new user
            io.to(`chat:${postId}`).emit('user-joined', { postId, count });

            console.log(`User ${socket.id} joined chat:${postId}, total: ${count}`);
        });

        // Send message to chat room
        socket.on('send-message', ({ postId, message }) => {
            // Broadcast to all users in the room (including sender)
            io.to(`chat:${postId}`).emit('message-received', { postId, message });

            console.log(`Message sent to chat:${postId}`, message.id);
        });

        // Leave chat room
        socket.on('leave-chat', ({ postId }) => {
            socket.leave(`chat:${postId}`);

            // Update active users
            if (activeUsers.has(postId)) {
                activeUsers.get(postId).delete(socket.id);
                const count = activeUsers.get(postId).size;

                if (count === 0) {
                    activeUsers.delete(postId);
                }

                // Notify room of user leaving
                io.to(`chat:${postId}`).emit('user-left', { postId, count });

                console.log(`User ${socket.id} left chat:${postId}, remaining: ${count}`);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Remove from all active chats
            for (const [postId, users] of activeUsers) {
                if (users.has(socket.id)) {
                    users.delete(socket.id);
                    const count = users.size;

                    if (count === 0) {
                        activeUsers.delete(postId);
                    }

                    io.to(`chat:${postId}`).emit('user-left', { postId, count });
                }
            }
        });
    });

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> WebSocket server running`);
        });
});
