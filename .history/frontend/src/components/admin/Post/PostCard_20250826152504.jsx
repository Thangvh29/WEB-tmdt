import { useState } from "react";
import api from "../../../services/axios";
import CommentList from "./CommentList";
import CreatePostForm from "./CreatePostForm";
import {
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
  MoreHorizontal,
  ThumbsUp,
  Share2,
} from "lucide-react";
import "../../../assets/style/posts-admin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const PostCard = ({
  post,
  isAdminPost,
  onUpdated,
  onDeleted,
  onApprove,
  showManagementIcons = false,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Xác nhận xóa?")) return;
    try {
      await api.delete(`/admin/posts/${post._id}`);
      if (onDeleted) onDeleted(post._id);
    } catch (err) {
      alert("Lỗi xóa: " + err.message);
    }
  };

  const handleApproveClick = (approve) => {
    if (onApprove) onApprove(post._id, approve);
  };

  const handlePostUpdated = (updated) => {
    setLocalPost(updated);
    if (onUpdated) onUpdated(updated);
    setShowEdit(false);
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <div className="author-section">
          <img
            src={localPost.author?.avatar || "/default-avatar.png"}
            alt="author"
            className="avatar"
          />
          <div className="author-info">
            <span className="name">{localPost.author?.name}</span>
            <span className="time">
              {new Date(localPost.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Menu actions */}
        <div className="relative">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              {isAdminPost && (
                <>
                  <button onClick={() => setShowEdit(true)}>
                    <Edit2 size={16} /> Chỉnh sửa
                  </button>
                  <button onClick={handleDelete}>
                    <Trash2 size={16} /> Xóa
                  </button>
                </>
              )}
              {showManagementIcons && (
                <>
                  {!localPost.isApproved && (
                    <button
                      className="text-green-600"
                      onClick={() => handleApproveClick(true)}
                    >
                      <Check size={16} /> Duyệt
                    </button>
                  )}
                  {localPost.isApproved && (
                    <button
                      className="text-yellow-600"
                      onClick={() => handleApproveClick(false)}
                    >
                      <X size={16} /> Từ chối
                    </button>
                  )}
                  <button className="text-red-600" onClick={handleDelete}>
                    <Trash2 size={16} /> Xóa
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!showEdit ? (
        <>
          <p className="post-content">{localPost.content}</p>

          {/* Images */}
          {localPost.images?.length > 0 && (
            <div
              className={`post-images ${
                localPost.images.length === 1 ? "single" : "grid"
              }`}
            >
              {localPost.images.map((img, i) => {
                // Nếu ảnh đã là URL tuyệt đối (http...), dùng trực tiếp
                const imgSrc = img.startsWith("http")
                  ? img
                  : `${API_BASE_URL}/uploads/post/${img}`;

                return <img key={i} src={imgSrc} alt={`img-${i}`} />;
              })}
            </div>
          )}

          {/* Actions */}
          <div className="post-stats">
            <span>{localPost.likeCount} lượt thích</span>
            <span>{localPost.commentCount || 0} bình luận</span>
          </div>

          <div className="post-actions">
            <button>
              <ThumbsUp size={18} /> Thích
            </button>
            <button onClick={() => setShowComments(!showComments)}>
              <MessageSquare size={18} /> Bình luận
            </button>
            <button>
              <Share2 size={18} /> Chia sẻ
            </button>
          </div>
        </>
      ) : (
        <CreatePostForm post={localPost} onPostCreated={handlePostUpdated} />
      )}

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          <CommentList postId={localPost._id} isAdmin={true} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
