// src/pages/admin/AdminPostsPage.jsx
import { useState, useEffect } from "react";
import api from "../../services/axios";
import PostCard from "../../components/admin/Post/PostCard";
import CreatePostForm from "../../components/admin/Post/CreatePostForm";
import "../../assets/style/posts-admin.css";

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
        // fallback: filter client-side nếu backend không support
        const adminPosts = data.posts?.filter(
          (p) => p.author?.role === "admin"
        );
        setPosts(adminPosts || []);
        setLoading(false);
      } catch  {
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
    <div className="admin-posts-page space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Bài đăng của Admin</h2>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Ẩn form" : "Tạo bài đăng mới"}
        </button>
      </div>

      {showCreateForm && <CreatePostForm onPostCreated={handlePostCreated} />}

      <div className="posts-feed space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500">Chưa có bài viết nào</p>
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
