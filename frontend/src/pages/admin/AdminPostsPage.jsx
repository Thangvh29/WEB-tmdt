// src/pages/admin/AdminPostsPage.jsx
import { useState, useEffect } from "react";
import api from "../../services/axios";
import PostCard from "../../components/admin/Post/PostCard";
import CreatePostForm from "../../components/admin/Post/CreatePostForm";
import { RefreshCcw } from "lucide-react"; // Thêm icon refresh
import "../../assets/style/posts-admin.css";

const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchAdminPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/posts/feed", {
        params: { page: 1, limit: 20, authorRole: "admin" },
      });
      const adminPosts = (data.posts || []).filter(
        (p) => p && p._id && p.author?.role === "admin"
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort mới nhất trước
      setPosts(adminPosts);
    } catch (err) {
      console.error("Error fetching admin posts:", err);
      setError("Không thể tải bài đăng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPosts();
  }, []);

  const handlePostCreated = (response) => {
    const newPost = response?.post || response;
    if (newPost && newPost._id) {
      setPosts((prev) => [newPost, ...prev]);
      setShowCreateForm(false);
    } else {
      console.error("Created post missing _id:", response);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    if (updatedPost && updatedPost._id) {
      setPosts((prev) =>
        prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
      );
    } else {
      console.error("Updated post missing _id:", updatedPost);
    }
  };

  const handlePostDeleted = (postId) => {
    if (postId) {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    }
  };

  if (loading) return <p>Đang tải bài viết...</p>;
  if (error) return <p className="text-red-600">Lỗi: {error}</p>;

  return (
    <div className="admin-posts-page">
      {/* Header */}
      <div className="posts-header">
        <h2>Bài đăng của Admin</h2>
        <div className="flex gap-2">
          <button
            className="btn-create flex items-center gap-2"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Ẩn form" : "Tạo bài đăng mới"}
          </button>
          <button className="btn-refresh flex items-center gap-2" onClick={fetchAdminPosts}>
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Form tạo bài đăng */}
      {showCreateForm && (
        <div className="create-post-card">
          <CreatePostForm onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Feed */}
      <div className="posts-feed max-w-2xl mx-auto"> {/* Giới hạn width giống feed social */}
        {posts.length === 0 ? (
          <p className="text-gray">Chưa có bài viết nào</p>
        ) : (
          posts.map((post, index) => {
            const safeKey = post._id || `post-${index}-${Date.now()}`;
            return (
              <PostCard
                key={safeKey}
                post={post}
                isAdminPost={true}
                onUpdated={handlePostUpdated}
                onDeleted={handlePostDeleted}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminPostsPage;