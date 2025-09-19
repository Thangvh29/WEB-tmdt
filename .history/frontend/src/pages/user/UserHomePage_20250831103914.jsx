import { useEffect, useState } from "react";
import api from "../../services/axios";
import PostCard from "../../components/user/PostCard";

const UserHomePage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchAdminFeed = async () => {
      try {
        // gọi API riêng cho admin feed
        const { data } = await api.get("/admin/posts/feed");
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Không tải được feed admin:", err);
      }
    };
    fetchAdminFeed();
  }, []);

  return (
    <div className="user-home-page">
      <h1>Trang chủ</h1>
      <div className="post-feed">
        {posts.map(p => (
          <PostCard key={p._id} post={p} onUpdated={() => {}} onDeleted={() => {}} />
        ))}
      </div>
    </div>
  );
};

export default UserHomePage;
