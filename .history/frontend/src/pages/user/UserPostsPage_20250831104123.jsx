import { useState, useEffect } from "react";
import api from "../../services/axios";
import PostForm from "../../components/user/PostForm";
import PostCard from "../../components/user/PostCard";

const UserPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const { data } = await api.get("/user/posts/feed", { params: { page, limit } });
      setPosts(prev => {
        const merged = [...prev, ...data.posts];
        return Array.from(new Map(merged.map(p => [p._id, p])).values());
      });
      setHasMore(data.posts.length === limit);
    } catch (err) {
      console.error("Không tải được feed user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [page]);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight &&
        !loading
      ) {
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  const handlePostCreated = newPost => setPosts(prev => [newPost, ...prev]);
  const handlePostUpdated = updated =>
    setPosts(prev => prev.map(p => (p._id === updated._id ? updated : p)));
  const handlePostDeleted = id => setPosts(prev => prev.filter(p => p._id !== id));

  return (
    <div className="user-posts-page">
      <h1>Bài viết của bạn</h1>
      <PostForm onPostCreated={handlePostCreated} />
      <div className="post-feed">
        {posts.map(p => (
          <PostCard key={p._id} post={p} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
        ))}
      </div>
      {loading && <p>Đang tải...</p>}
      {!hasMore && <p>Hết bài.</p>}
    </div>
  );
};

export default UserPostsPage;
