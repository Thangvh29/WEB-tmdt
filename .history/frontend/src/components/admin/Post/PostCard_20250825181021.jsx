// src/components/admin/PostCard.jsx
import { useState } from "react";
import api from "../../../services/axios";
import CommentList from "./CommentList";
import CreatePostForm from "./"; // dùng chung để edit
import { Edit2, Trash2, Check, X, MessageSquare } from "lucide-react";

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
    <div className="post-card border p-4 rounded-lg shadow-sm space-y-3">
      {/* Header */}
      <div className="post-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={localPost.author?.avatar || "/default-avatar.png"}
            alt="author"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{localPost.author?.name}</h3>
            <p className="text-sm text-gray-500">
              {new Date(localPost.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdminPost && (
            <>
              <button onClick={() => setShowEdit(true)}>
                <Edit2 size={16} />
              </button>
              <button onClick={handleDelete}>
                <Trash2 size={16} />
              </button>
            </>
          )}

          {showManagementIcons && (
            <>
              {!localPost.isApproved && (
                <button
                  className="text-green-600 flex items-center gap-1"
                  onClick={() => handleApproveClick(true)}
                >
                  <Check size={16} /> Duyệt
                </button>
              )}
              {localPost.isApproved && (
                <button
                  className="text-yellow-600 flex items-center gap-1"
                  onClick={() => handleApproveClick(false)}
                >
                  <X size={16} /> Từ chối
                </button>
              )}
              <button
                className="text-red-600 flex items-center gap-1"
                onClick={handleDelete}
              >
                <Trash2 size={16} /> Xóa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="whitespace-pre-line">{localPost.content}</p>

      {/* Images */}
      {localPost.images?.length > 0 && (
        <div className="post-images grid grid-cols-2 gap-2">
          {localPost.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`img-${i}`}
              className="w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions flex justify-between text-sm text-gray-600">
        <span>{localPost.likeCount} Likes</span>
        <button
          className="flex items-center gap-1"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={16} /> Bình luận (
          {localPost.commentCount || 0})
        </button>
      </div>

      {/* Edit Form */}
      {showEdit && (
        <CreatePostForm
          post={localPost}
          onPostCreated={handlePostUpdated} // dùng lại callback
        />
      )}

      {/* CommentList */}
      {showComments && (
        <CommentList postId={localPost._id} isAdmin={true} />
      )}
    </div>
  );
};

export default PostCard;
