// frontend/src/pages/user/UserHomePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import PostForm from '../../components/user/PostForm';
import PostCard from '../../components/user/PostCard';
import '../../assets/style/user-home.css'; // Giả sử CSS cho trang chủ

const UserHomePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [page]);

  const fetchFeed = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const { data } = await api.get('/user/posts/feed', { params: { page, limit } });
      setPosts(prev => [...prev, ...data.posts]);
      setTotal(data.total);
      setHasMore(data.posts.length === limit);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loading) return;
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <div className="user-home-page">
      <h1>Trang chủ</h1>
      <PostForm onPostCreated={handlePostCreated} />
      <div className="post-feed">
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onUpdated={handlePostUpdated}
            onDeleted={handlePostDeleted}
          />
        ))}
      </div>
      {loading && <p>Đang tải thêm...</p>}
      {!hasMore && <p>Đã hết bài viết.</p>}
    </div>
  );
};

export default UserHomePage;