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
        
        // ✅ FIX: Đảm bảo dữ liệu hợp lệ và có _id
        const adminPosts = (data.posts || [])
          .filter((p) => p && p._id && p.author?.role === "admin");
        
        console.log('Filtered admin posts:', adminPosts); // Debug log
        setPosts(adminPosts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin posts:', err); // Debug log
        setError("Không thể tải bài đăng");
        setLoading(false);
      }
    };
    fetchAdminPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    // ✅ FIX: Đảm bảo newPost có _id trước khi thêm
    if (newPost && newPost._id) {
      setPosts([newPost, ...posts]);
      setShowCreateForm(false);
    } else {
      console.error('Created post missing _id:', newPost);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    // ✅ FIX: Đảm bảo updatedPost có _id trước khi update
    if (updatedPost && updatedPost._id) {
      setPosts(posts.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    } else {
      console.error('Updated post missing _id:', updatedPost);
    }
  };

  const handlePostDeleted = (postId) => {
    // ✅ FIX: Đảm bảo postId hợp lệ
    if (postId) {
      setPosts(posts.filter((p) => p._id !== postId));
    }
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
          posts.map((post, index) => {
            // ✅ FIX: Kiểm tra và sử dụng key fallback an toàn
            const safeKey = post._id || `post-${index}-${Date.now()}`;
            
            // Debug log để kiểm tra dữ liệu
            if (!post._id) {
              console.warn('Post missing _id:', post, 'using fallback key:', safeKey);
            }
            
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