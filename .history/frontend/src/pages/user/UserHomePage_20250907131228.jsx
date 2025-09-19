//
import { useEffect, useState } from "react";
import api from "../../services/axios";
import PostCard from "../../components/user/PostCard";

const UserHomePage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchAdminPosts = async () => {
      try {
        // ✅ gọi admin feed để chỉ lấy bài admin
        const { data } = await api.get("/admin/posts/feed", {
          params: { page: 1, limit: 12 },
        });
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Không tải được bài admin:", err);
      }
    };
    fetchAdminPosts();
  }, []);

  return (
    <div className="user-home-page">
      <h1>Trang chủ</h1>
      <div className="post-feed">
        {posts.map((p) => (
          <PostCard key={p._id} post={p} onUpdated={() => {}} onDeleted={() => {}} />
        ))}
      </div>
    </div>
  );
};

export default UserHomePage;
