// src/components/admin/CommentList.jsx
import { useState, useEffect } from "react";
import api from "../../../services/axios";
import { Trash2, Check, X } from "lucide-react";

const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // commentId đang xử lý

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/admin/posts/${postId}/comments`);
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
      const { data } = await api.post(`/admin/posts/${postId}/comments`, {
        content: newComment,
      });
      setComments([data.comment, ...comments]); // prepend
      setNewComment("");
    } catch (err) {
      alert("Lỗi thêm comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Xóa comment?")) return;
    setActionLoading(commentId);
    try {
      await api.delete(`/admin/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      alert("Lỗi xóa");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveComment = async (commentId, approve) => {
    setActionLoading(commentId);
    try {
      await api.patch(`/admin/comments/${commentId}`, { isApproved: approve });
      setComments(
        comments.map((c) =>
          c._id === commentId ? { ...c, isApproved: approve } : c
        )
      );
    } catch (err) {
      alert("Lỗi duyệt");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>Đang tải comments...</p>;

  return (
    <div className="comment-list space-y-3">
      <h4 className="text-lg font-semibold">Bình luận</h4>

      {comments.map((comment) => (
        <div
          key={comment._id}
          className="comment-item border p-2 rounded flex justify-between items-start"
        >
          <div>
            <p>
              <strong>{comment.author?.name || "Ẩn danh"}:</strong>{" "}
              {comment.content}
            </p>
            <p className="text-sm text-gray-500">
              {comment.isApproved === true
                ? "✅ Đã duyệt"
                : comment.isApproved === false
                ? "❌ Từ chối"
                : "⏳ Chờ duyệt"}
            </p>
          </div>

          <div className="flex gap-2">
            {comment.isApproved !== true && (
              <button
                disabled={actionLoading === comment._id}
                onClick={() => handleApproveComment(comment._id, true)}
                className="text-green-600 flex items-center gap-1"
              >
                <Check size={16} /> Duyệt
              </button>
            )}
            <button
              disabled={actionLoading === comment._id}
              onClick={() => handleApproveComment(comment._id, false)}
              className="text-yellow-600 flex items-center gap-1"
            >
              <X size={16} /> Từ chối
            </button>
            <button
              disabled={actionLoading === comment._id}
              onClick={() => handleDeleteComment(comment._id)}
              className="text-red-600 flex items-center gap-1"
            >
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </div>
      ))}

      <div className="add-comment flex gap-2 mt-4">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Thêm bình luận..."
          className="border p-2 flex-1 rounded"
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Gửi
        </button>
      </div>
    </div>
  );
};

export default CommentList;
