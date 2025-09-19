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
      await api.post(`/user/posts/${postId}/comments`, {
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
    <div className="comment-section mt-4">
      {/* Form comment mới */}
      <div className="flex gap-2 mb-4">
        <img
          src="/default-avatar.png"
          alt="avatar"
          className="w-9 h-9 rounded-full border"
        />
        <div className="flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="w-full border rounded-full px-4 py-2 text-sm focus:ring focus:ring-blue-200"
          />
        </div>
        <button
          onClick={handleSubmitComment}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Đăng
        </button>
      </div>

      {/* Danh sách comment */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-2">
            <img
              src={comment.author?.avatar || "/default-avatar.png"}
              alt="avatar"
              className="w-9 h-9 rounded-full border"
            />
            <div className="flex-1">
              <div className="bg-gray-100 px-3 py-2 rounded-2xl">
                <p className="font-semibold text-sm">
                  {comment.author?.name || "Người dùng"}{" "}
                  <span className="ml-2 text-xs text-gray-500">1 giờ trước</span>
                </p>
                <p className="text-sm">{comment.content}</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mt-1 ml-2">
                <button className="hover:underline">Thích</button>
                <button
                  onClick={() =>
                    setReplyTo(replyTo === comment._id ? null : comment._id)
                  }
                  className="hover:underline"
                >
                  Trả lời
                </button>
              </div>

              {/* Form trả lời */}
              {replyTo === comment._id && (
                <div className="flex gap-2 mt-2">
                  <img
                    src="/default-avatar.png"
                    alt="avatar"
                    className="w-7 h-7 rounded-full border"
                  />
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết phản hồi..."
                    className="flex-1 border rounded-full px-3 py-1 text-sm focus:ring focus:ring-blue-200"
                  />
                  <button
                    onClick={() => handleSubmitReply(comment._id)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                  >
                    Gửi
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies?.map((reply) => (
                <div key={reply._id} className="flex gap-2 mt-2 ml-10">
                  <img
                    src={reply.author?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="w-7 h-7 rounded-full border"
                  />
                  <div>
                    <div className="bg-gray-50 px-3 py-1.5 rounded-2xl">
                      <p className="font-semibold text-xs">
                        {reply.author?.name || "Người dùng"}{" "}
                        <span className="ml-2 text-xs text-gray-500">
                          30 phút trước
                        </span>
                      </p>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1 ml-2">
                      <button className="hover:underline">Thích</button>
                      <button
                        onClick={() =>
                          setReplyTo(replyTo === reply._id ? null : reply._id)
                        }
                        className="hover:underline"
                      >
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nút tải thêm */}
      {page * limit < total && (
        <div className="text-center mt-4">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
          >
            Xem thêm bình luận
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
