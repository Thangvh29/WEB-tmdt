// frontend/src/components/user/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [page]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/user/posts/${postId}/comments`, { params: { page, limit } });
      setComments(data.comments);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitComment = async () => {
    try {
      const { data } = await api.post(`/user/posts/${postId}/comments`, { content: newComment, parent: null });
      setComments(prev => [data.comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReply = async (parentId) => {
    try {
      const { data } = await api.post(`/user/posts/${postId}/comments`, { content: replyContent, parent: parentId });
      fetchComments(); // Reload để thấy replies
      setReplyContent('');
      setReplyTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="comment-section">
      <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Bình luận..." />
      <button onClick={handleSubmitComment}>Gửi</button>
      <div className="comments">
        {comments.map(comment => (
          <div key={comment._id} className="comment">
            <p>{comment.author.name}: {comment.content}</p>
            <button onClick={() => setReplyTo(comment._id)}>Trả lời</button>
            {replyTo === comment._id && (
              <>
                <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Trả lời..." />
                <button onClick={() => handleSubmitReply(comment._id)}>Gửi trả lời</button>
              </>
            )}
            {comment.replies?.map(reply => (
              <div key={reply._id} className="reply">
                <p>{reply.author.name}: {reply.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      {page * limit < total && <button onClick={() => setPage(prev => prev + 1)}>Tải thêm bình luận</button>}
    </div>
  );
};

export default CommentSection;