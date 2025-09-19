// src/components/admin/CommentList.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/axios';
import { Trash2, Check, X } from 'lucide-react';

const CommentList = ({ postId, isAdmin = false }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await api.get(`/admin/posts/${postId}/comments`); // Giả sử có endpoint get comments by post
        setComments(data.comments || []);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment) return;
    try {
      const { data } = await api.post(`/admin/posts/${postId}/comments`, { content: newComment });
      setComments([...comments, data.comment]);
      setNewComment('');
    } catch (err) {
      alert('Lỗi thêm comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('Xóa comment?')) {
      try {
        await api.delete(`/admin/comments/${commentId}`); // Giả sử endpoint delete comment
        setComments(comments.filter(c => c._id !== commentId));
      } catch (err) {
        alert('Lỗi xóa');
      }
    }
  };

  const handleApproveComment = async (commentId, approve) => {
    try {
      await api.patch(`/admin/comments/${commentId}`, { isApproved: approve });
      setComments(comments.map(c => c._id === commentId ? { ...c, isApproved: approve } : c));
    } catch (err) {
      alert('Lỗi duyệt');
    }
  };

  if (loading) return <p>Đang tải comments...</p>;

  return (
    <div className="comment-list">
      <h4>Bình luận</h4>
      {comments.map((comment) => (
        <div key={comment._id} className="comment-item">
          <p><strong>{comment.author.name}:</strong> {comment.content}</p>
          {isAdmin && (
            <>
              {!comment.isApproved && <button onClick={() => handleApproveComment(comment._id, true)}><Check size={16} /> Duyệt</button>}
              <button onClick={() => handleApproveComment(comment._id, false)}><X size={16} /> Từ chối</button>
              <button onClick={() => handleDeleteComment(comment._id)}><Trash2 size={16} /> Xóa</button>
            </>
          )}
        </div>
      ))}
      {isAdmin && (
        <div className="add-comment">
          <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Thêm bình luận" />
          <button onClick={handleAddComment}>Gửi</button>
        </div>
      )}
    </div>
  );
};

export default CommentList;