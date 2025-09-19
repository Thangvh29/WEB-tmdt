// src/components/admin/CommentList.jsx
import { useState, useEffect } from "react";
import api from "../../../services/axios";
import { Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import vi from 'date-fns/locale/vi';

const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/admin/comments/posts/${postId}/comments`);
        setComments(data.comments || []);
      } catch (err) {
        console.error("Lỗi tải comments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/admin/comments/posts/${postId}/comments`, {
        content: newComment,
      });
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Lỗi thêm comment:", err);
      alert("Lỗi thêm comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Xóa comment?")) return;
    setActionLoading(commentId);
    try {
      await api.delete(`/admin/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Lỗi xóa");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveComment = async (commentId, approve) => {
    setActionLoading(commentId);
    try {
      await api.patch(`/admin/comments/${commentId}`, { isApproved: approve });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, isApproved: approve } : c
        )
      );
    } catch (err) {
      console.error("Lỗi duyệt:", err);
      alert("Lỗi duyệt");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>Đang tải comments...</p>;

  return (
    <div className="comment-list space-y-4">
      {comments.map((comment) => {
        const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi });
        return (
          <div key={comment._id} className="comment-item flex items-start gap-3">
            <img
              src={comment.author?.avatar || "/default-avatar.png"}
              alt="author"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <div className="bg-[#f0f2f5] p-3 rounded-lg">
                <p className="font-semibold text-[#050505]">{comment.author?.name || "Ẩn danh"}</p>
                <p className="text-[#050505]">{comment.content}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#65676b] mt-1">
                <span>{timeAgo}</span> {/* Thêm timestamp */}
                {comment.isApproved === true ? (
                  <span className="text-green-600">✅ Đã duyệt</span>
                ) : comment.isApproved === false ? (
                  <span className="text-red-600">❌ Từ chối</span>
                ) : (
                  <span className="text-yellow-600">⏳ Chờ duyệt</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {comment.isApproved !== true && (
                <button
                  disabled={actionLoading === comment._id}
                  onClick={() => handleApproveComment(comment._id, true)}
                  className="text-green-600"
                >
                  <Check size={16} />
                </button>
              )}
              <button
                disabled={actionLoading === comment._id}
                onClick={() => handleApproveComment(comment._id, false)}
                className="text-yellow-600"
              >
                <X size={16} />
              </button>
              <button
                disabled={actionLoading === comment._id}
                onClick={() => handleDeleteComment(comment._id)}
                className="text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add comment input */}
      <div className="add-comment flex items-center gap-3 mt-4">
        <img src="/default-avatar.png" alt="you" className="w-8 h-8 rounded-full" /> {/* Avatar người dùng */}
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} // Enter to post
          placeholder="Viết bình luận..."
          className="flex-1 p-3 bg-[#f0f2f5] rounded-full border-none outline-none"
        />
      </div>
    </div>
  );
};

export default CommentList;