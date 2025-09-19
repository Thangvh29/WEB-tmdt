// frontend/src/components/user/CommentSection.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import "../../assets/style/comment-section.css";
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
    <div className="comment-section">
      {/* Form comment mới */}
      <div className="comment-form">
        <img src="/default-avatar.png" alt="avatar" className="avatar" />
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết bình luận..."
        />
        <button onClick={handleSubmitComment}>Đăng</button>
      </div>

      {/* Danh sách comment */}
      <div className="comment-list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment-item">
            <img
              src={comment.author?.avatar || "/default-avatar.png"}
              alt="avatar"
              className="avatar"
            />
            <div className="comment-body">
              <div className="comment-bubble">
                <span className="author">{comment.author?.name || "Người dùng"}</span>
                <span className="time">1 giờ trước</span>
                <p>{comment.content}</p>
              </div>
              <div className="comment-actions">
                <button>Thích</button>
                <button onClick={() => setReplyTo(comment._id)}>Trả lời</button>
              </div>

              {/* Replies */}
              {comment.replies?.map((reply) => (
                <div key={reply._id} className="reply-item">
                  <img
                    src={reply.author?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="avatar small"
                  />
                  <div className="comment-body">
                    <div className="comment-bubble reply">
                      <span className="author">{reply.author?.name || "Người dùng"}</span>
                      <span className="time">30 phút trước</span>
                      <p>{reply.content}</p>
                    </div>
                    <div className="comment-actions">
                      <button>Thích</button>
                      <button onClick={() => setReplyTo(reply._id)}>Trả lời</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
