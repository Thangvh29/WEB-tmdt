//frontend/src/pages/user/UserHomePage.jsx
import { useEffect, useState } from "react";
import api from "../../services/axios";
import PostCard from "../../components/user/PostCard";

const UserHomePage = () => {
  const [posts, setPosts] = useState([]);

useEffect(() => {
  const fetchAdminPosts = async () => {
    try {
      // ✅ gọi feed user nhưng lọc role=admin (cần backend hỗ trợ thêm)
      const { data } = await api.get("/user/posts/feed", {
        params: { page: 1, limit: 12, role: "admin" },
      });

      // nếu backend chưa hỗ trợ filter thì lọc ở frontend
      const adminPosts = (data.posts || []).filter(
        (p) => p.author?.role === "admin"
      );

      setPosts(adminPosts);
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
