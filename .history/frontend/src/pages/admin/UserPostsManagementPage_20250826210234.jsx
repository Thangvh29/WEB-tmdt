// src/pages/admin/UserPostsManagementPage.jsx
import { useState, useEffect } from 'react';
import api from '../../services/axios';
import PostCard from '../../components/admin/Post/PostCard';
import '../../assets/style/posts-admin.css';

const UserPostsManagementPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const { data } = await api.get('/admin/posts/feed', {
          params: { page: 1, limit: 20, approved: false, authorRole: 'user' }
        });
        const sortedPosts = (data.posts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort mới nhất
        setPosts(sortedPosts);
      } catch {
        setError('Không thể tải bài đăng của người dùng');
      } finally {
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, []);

  const handleApprove = async (postId, approve) => {
    try {
      const { data } = await api.patch(`/admin/posts/${postId}`, { isApproved: approve });
      setPosts(posts.map(p => p._id === postId ? data.post : p));
    } catch (err) {
      alert('Lỗi duyệt bài: ' + err.message);
    }
  };

  const handlePostDeleted = (postId) => {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      setPosts(posts.filter(p => p._id !== postId));
    }
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="user-posts-management-page">
      <h2>Quản lý bài viết của người dùng</h2>
      <div className="posts-feed max-w-2xl mx-auto"> {/* Giới hạn width giống feed */}
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              isAdminPost={false} 
              onApprove={handleApprove} 
              onDeleted={handlePostDeleted} 
              showManagementIcons={true} 
            />
          ))
        ) : (
          <p>Không có bài viết nào cần duyệt.</p>
        )}
      </div>
    </div>
  );
};

export default UserPostsManagementPage;