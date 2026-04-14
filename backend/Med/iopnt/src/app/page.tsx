"use client";

import { useState, useEffect } from "react";
import { Post } from "@/types/post";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { PostComposer } from "@/components/Post/PostComposer";
import { Feed } from "@/components/Post/Feed";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { fetchPosts, createPost as apiCreatePost } from "@/lib/api";
import styles from "./page.module.css";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeChatPostId, setActiveChatPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load posts from API on mount
  useEffect(() => {
    async function loadPosts() {
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
      setLoading(false);
    }

    loadPosts();

    // Refresh posts every 30 seconds
    const interval = setInterval(loadPosts, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleNewPost = async (post: Post) => {
    // Optimistic update
    setPosts([post, ...posts]);

    // Save to backend
    const createdPost = await apiCreatePost(post);

    if (!createdPost) {
      // Rollback on error
      setPosts(posts.filter(p => p.id !== post.id));
      alert("Failed to create post. Please try again.");
    }
  };

  const handleOpenChat = (postId: string) => {
    setActiveChatPostId(postId);
  };

  const handleCloseChat = () => {
    setActiveChatPostId(null);
  };

  const activeChatPost = posts.find(p => p.id === activeChatPostId);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <Sidebar />
          </div>
          <main className={styles.main}>
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              Loading...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <Sidebar />
        </div>

        <main className={styles.main}>
          <PostComposer onPost={handleNewPost} />
          <Feed posts={posts} onOpenChat={handleOpenChat} />
        </main>

        <aside className={styles.aside}>
          {/* Future: Trending topics, active chats, etc. */}
        </aside>
      </div>

      {activeChatPost && (
        <ChatRoom post={activeChatPost} onClose={handleCloseChat} />
      )}
    </div>
  );
}
