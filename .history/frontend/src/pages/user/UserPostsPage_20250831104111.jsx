// frontend/src/pages/user/UserPostPage.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import PostForm from "../../components/user/PostForm";
import PostCard from "../../components/user/PostCard";

const UserPostPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/user/posts/me"); // backend cần có API lấy bài viết của chính user
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Lỗi lấy bài viết user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div className="user-post-page">
      <h1>Bài viết của tôi</h1>
      <PostForm onPostCreated={handlePostCreated} />
      {loading && <p>Đang tải...</p>}
      {!loading && posts.length === 0 && <p>Chưa có bài viết nào.</p>}
      <div className="post-list">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onUpdated={handlePostUpdated}
            onDeleted={handlePostDeleted}
          />
        ))}
      </div>
    </div>
  );
};

export default UserPostPage;
