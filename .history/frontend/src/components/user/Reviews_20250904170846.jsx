// frontend/src/components/user/Reviews.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import "../../reviews.css";

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ content: "", rating: 5 });
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/user/products/${productId}/reviews`);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.post(`/user/products/${productId}/reviews`, newReview);
      setNewReview({ content: "", rating: 5 });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReply = async (parentId) => {
    try {
      await api.post(
        `/user/products/${productId}/reviews/${parentId}/reply`,
        { content: replyContent }
      );
      setReplyContent("");
      setReplyTo(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="reviews">
      <h2>Đánh giá sản phẩm</h2>

      {/* Form đánh giá */}
      <div className="review-form">
        <select
          value={newReview.rating}
          onChange={(e) =>
            setNewReview({ ...newReview, rating: Number(e.target.value) })
          }
        >
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s} sao
            </option>
          ))}
        </select>
        <textarea
          value={newReview.content}
          onChange={(e) =>
            setNewReview({ ...newReview, content: e.target.value })
          }
          placeholder="Chia sẻ cảm nhận của bạn..."
        />
        <button onClick={handleSubmitReview}>Gửi đánh giá</button>
      </div>

      {/* Danh sách review */}
      <div className="review-list">
        {reviews.length === 0 && <p>Chưa có đánh giá nào</p>}
        {reviews.map((r) => (
          <div key={r._id} className="review-item">
            <div className="review-header">
              <strong>{r.author?.name || "Người dùng"}</strong>
              <span className="stars">
                {"★".repeat(r.rating || 0)}
                {"☆".repeat(5 - (r.rating || 0))}
              </span>
            </div>
            <p>{r.content}</p>
            <button onClick={() => setReplyTo(r._id)}>Trả lời</button>

            {/* Form reply */}
            {replyTo === r._id && (
              <div className="reply-form">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Phản hồi đánh giá..."
                />
                <button onClick={() => handleSubmitReply(r._id)}>Gửi</button>
              </div>
            )}

            {/* Replies */}
            {r.replies &&
              r.replies.map((rep) => (
                <div key={rep._id} className="reply-item">
                  <strong>{rep.author?.name || "Người dùng"}</strong>
                  <p>{rep.content}</p>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
