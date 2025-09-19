// src/pages/admin/AdminPostsPage.jsx
import { useState, useEffect } from 'react';
import api from '../../services/axios';
import PostCard from '../../components/admin/PostCard';
import CreatePostForm from '../../components/admin/CreatePostForm';
import '../../assets/style/posts-admin.css';

const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchAdminPosts = async () => {
      try {
        const { data } = await api.get('/admin/posts/feed', { // Sử dụng getFeed nhưng filter admin only? Hoặc getUserPosts với userId=admin
          params: { page: 1, limit: 20, authorRole: 'admin' } // Giả sử backend hỗ trợ filter, nếu không thì filter client-side
        });
        setPosts(data.posts || []);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải bài đăng');
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
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="admin-posts-page">
      <h2>Bài đăng của Admin</h2>
      <button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Ẩn form' : 'Tạo bài đăng mới'}
      </button>
      {showCreateForm && <CreatePostForm onPostCreated={handlePostCreated} />}
      <div className="posts-feed">
        {posts.map((post) => (
          <PostCard 
            key={post._id} 
            post={post} 
            isAdminPost={true} 
            onUpdated={handlePostUpdated} 
            onDeleted={handlePostDeleted} 
          />
        ))}
      </div>
    </div>
  );
};

export default AdminPostsPage;