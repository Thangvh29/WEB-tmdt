// src/components/admin/Post/PostCard.jsx
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
import { formatDistanceToNow } from 'date-fns'; // Install date-fns nếu chưa: npm i date-fns
import vi from 'date-fns/locale/vi'; // Locale tiếng Việt

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
  const [liked, setLiked] = useState(false); // State like giả định

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

  const handleLike = () => {
    setLiked(!liked);
    // Gọi API like nếu có: api.post(`/posts/${post._id}/like`);
  };

  const resolveImageUrl = (img) => {
    if (!img) return "/default-post.png";
    if (img.startsWith("http")) return img;
    if (img.startsWith("uploads/post/") || img.startsWith("/uploads/post/")) {
      return `${API_BASE_URL}/${img.replace(/^\/+/, "")}`;
    }
    return `${API_BASE_URL}/uploads/post/${img}`;
  };

  const timeAgo = formatDistanceToNow(new Date(localPost.createdAt), { addSuffix: true, locale: vi }); // "2 phút trước"

  return (
    <div className="post-card bg-white rounded-lg shadow-md p-4 mb-4"> {/* Rounded giống FB */}
      {/* Header */}
      <div className="post-card-header flex justify-between items-start">
        <div className="author-section flex items-center gap-3">
          <img
            src={localPost.author?.avatar || "/default-avatar.png"}
            alt="author"
            className="w-10 h-10 rounded-full border border-gray-300"
          />
          <div>
            <p className="font-semibold text-[#050505]">{localPost.author?.name || "Admin"}</p>
            <p className="text-sm text-[#65676b]">{timeAgo}</p> {/* Thêm timestamp */}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-full hover:bg-gray-200">
            <MoreHorizontal size={20} className="text-[#65676b]" />
          </button>
          {menuOpen && (
            <div className="menu-dropdown absolute right-0 top-full mt-2 bg-white border border-[#ddd] rounded-lg shadow-lg flex flex-col min-w-[150px] z-10">
              {isAdminPost ? (
                <>
                  <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f0f2f5]">
                    <Edit2 size={16} className="text-[#1877f2]" /> Sửa
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f0f2f5]">
                    <Trash2 size={16} className="text-red-600" /> Xóa
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleApproveClick(true)} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f0f2f5]">
                    <Check size={16} className="text-green-600" /> Duyệt
                  </button>
                  <button onClick={() => handleApproveClick(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f0f2f5]">
                    <X size={16} className="text-yellow-600" /> Từ chối
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f0f2f5]">
                    <Trash2 size={16} className="text-red-600" /> Xóa
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
          <p className="post-content mt-2 text-[#050505]">{localPost.content}</p>

          {/* Images */}
          {localPost.images?.length > 0 && (
            <div
              className={`post-images mt-3 ${localPost.images.length === 1 ? "single" : "grid"}`}
            >
              {localPost.images.map((img, i) => (
                <img key={i} src={resolveImageUrl(img)} alt={`img-${i}`} className="rounded-md" />
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="post-stats mt-3 flex items-center gap-4 text-sm text-[#65676b]">
            <span>{localPost.likeCount} lượt thích</span>
            <span>{localPost.commentCount || 0} bình luận</span>
          </div>

          {/* Actions */}
          <div className="post-actions mt-2 pt-2 border-t border-[#ddd] flex justify-around">
            <button onClick={handleLike} className={`flex items-center gap-1 ${liked ? 'text-[#1877f2]' : 'text-[#65676b]'} hover:text-[#1877f2]`}>
              <ThumbsUp size={18} /> Thích
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-[#65676b] hover:text-[#1877f2]">
              <MessageSquare size={18} /> Bình luận
            </button>
            <button className="flex items-center gap-1 text-[#65676b] hover:text-[#1877f2]">
              <Share2 size={18} /> Chia sẻ
            </button>
          </div>
        </>
      ) : (
        <CreatePostForm post={localPost} onPostCreated={handlePostUpdated} />
      )}

      {/* Comments */}
      {showComments && (
        <div className="comments-section mt-4 border-t border-[#ddd] pt-4">
          <CommentList postId={localPost._id} isAdmin={true} />
        </div>
      )}
    </div>
  );
};

export default PostCard;