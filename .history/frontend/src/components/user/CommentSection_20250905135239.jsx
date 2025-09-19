// frontend/src/components/user/CommentSection.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [page]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/user/posts/${postId}/comments`, {
        params: { page, limit },
      });
      setComments(data.comments);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/user/posts/${postId}/comments`, {
        content: newComment,
        parent: null,
      });
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReply = async (parentId) => {
    if (!replyContent.trim()) return;
    try {
      const { data } = await api.post(`/user/posts/${postId}/comments`, {
        content: replyContent,
        parent: parentId,
      });
      fetchComments();
      setReplyContent("");
      setReplyTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="comment-section bg-white p-4 rounded-lg shadow">
      {/* Nhập comment mới */}
      <div className="flex gap-2 mb-4">
        <img
          src="/default-avatar.png"
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="w-full border rounded-lg p-2 text-sm resize-none focus:ring focus:ring-blue-200"
          />
          <div className="text-right mt-2">
            <button
              onClick={handleSubmitComment}
              className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách comment */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            <div className="flex items-start gap-2">
              <img
                src={comment.author?.avatar || "/default-avatar.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
              />
              <div className="flex-1">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <p className="font-semibold text-sm">
                    {comment.author?.name || "Người dùng"}
                  </p>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <button
                    onClick={() => setReplyTo(comment._id)}
                    className="hover:underline"
                  >
                    Trả lời
                  </button>
                  <span>1 ngày trước</span>
                </div>

                {/* Form trả lời */}
                {replyTo === comment._id && (
                  <div className="mt-2 ml-6">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      className="w-full border rounded-lg p-2 text-sm resize-none focus:ring focus:ring-blue-200"
                    />
                    <div className="text-right mt-1">
                      <button
                        onClick={() => handleSubmitReply(comment._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        Gửi trả lời
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply */}
                {comment.replies?.map((reply) => (
                  <div
                    key={reply._id}
                    className="mt-2 ml-6 flex gap-2 items-start"
                  >
                    <img
                      src={reply.author?.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="w-7 h-7 rounded-full border"
                    />
                    <div className="bg-gray-50 p-2 rounded-lg flex-1">
                      <p className="font-semibold text-xs">
                        {reply.author?.name || "Người dùng"}
                      </p>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nút tải thêm */}
      {page * limit < total && (
        <div className="text-center mt-4">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            Tải thêm bình luận
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
