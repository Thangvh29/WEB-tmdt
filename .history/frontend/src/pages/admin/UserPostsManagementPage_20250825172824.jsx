// src/pages/admin/UserPostsManagementPage.jsx
import { useState, useEffect } from 'react';
import api from '../../services/axios';
import PostCard from '../../components/admin/PostCard';
import '../../assets/style/posts-admin.css';

const UserPostsManagementPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const { data } = await api.get('/admin/posts/feed', {
          params: { page: 1, limit: 20, approved: false, authorRole: 'user' } // Filter chưa duyệt, user posts
        });
        setPosts(data.posts || []);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải bài đăng của người dùng');
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, []);

  const handleApprove = async (postId, approve) => {
    try {
      await api.post(`/admin/posts/${postId}/moderate`, { isApproved: approve });
      setPosts(posts.map(p => p._id === postId ? { ...p, isApproved: approve } : p));
    } catch (err) {
      alert('Lỗi duyệt bài: ' + err.message);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="user-posts-management-page">
      <h2>Quản lý bài viết của người dùng</h2>
      <div className="posts-feed">
        {posts.map((post) => (
          <PostCard 
            key={post._id} 
            post={post} 
            isAdminPost={false} 
            onApprove={handleApprove} 
            onDeleted={handlePostDeleted} 
            showManagementIcons={true} 
          />
        ))}
      </div>
    </div>
  );
};

export default UserPostsManagementPage;