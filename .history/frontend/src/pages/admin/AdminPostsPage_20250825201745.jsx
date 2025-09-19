// src/pages/admin/AdminPostsPage.jsx
import { useState, useEffect } from "react";
import api from "../../services/axios";
import PostCard from "../../components/admin/Post/PostCard";
import CreatePostForm from "../../components/admin/Post/CreatePostForm";
import "../../assets/style/posts-admin.css";
import "../../../assets/style/post-card.css";
const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchAdminPosts = async () => {
      try {
        const { data } = await api.get("/admin/posts/feed", {
          params: { page: 1, limit: 20, authorRole: "admin" },
        });
        const adminPosts = data.posts?.filter(
          (p) => p.author?.role === "admin"
        );
        setPosts(adminPosts || []);
        setLoading(false);
      } catch {
        setError("Không thể tải bài đăng");
        setLoading(false);
      }
    };
    fetchAdminPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateForm(false);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((p) => p._id !== postId));
  };

  if (loading) return <p>Đang tải bài viết...</p>;
  if (error) return <p className="text-red-600">Lỗi: {error}</p>;

  return (
    <div className="admin-posts-page">
      {/* Header */}
      <div className="posts-header">
        <h2>Bài đăng của Admin</h2>
        <button
          className="btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Ẩn form" : "Tạo bài đăng mới"}
        </button>
      </div>

      {/* Form tạo bài đăng */}
      {showCreateForm && (
        <div className="create-post-card">
          <CreatePostForm onPostCreated={handlePostCreated} />
        </div>
      )}

      {/* Feed */}
      <div className="posts-feed">
        {posts.length === 0 ? (
          <p className="text-gray">Chưa có bài viết nào</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              isAdminPost={true}
              onUpdated={handlePostUpdated}
              onDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPostsPage;
