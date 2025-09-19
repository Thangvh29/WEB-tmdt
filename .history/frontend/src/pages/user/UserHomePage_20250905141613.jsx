import { useEffect, useState } from "react";
import api from "../../services/axios";
import PostCard from "../../components/user/PostCard";

const UserHomePage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchUserFeed = async () => {
      try {
        // ✅ gọi API user feed thay vì admin feed
        const { data } = await api.get("/user/posts/feed?page=1&limit=12");
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Không tải được feed user:", err);
      }
    };
    fetchUserFeed();
  }, []);

  return (
    <div className="user-home-page">
      <h1>Trang chủ</h1>
      <div className="post-feed">
        {posts.map((p) => (
          <PostCard
            key={p._id}
            post={p}
            onUpdated={() => {}}
            onDeleted={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default UserHomePage;
