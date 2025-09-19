// src/components/admin/PostCard.jsx
import { useState } from 'react';
import api from '../../../services/axios';
import CommentList from './CommentList';
import CreatePostForm from './CreatePostForm'; // Để edit
import { Edit2, Trash2, Check, X, MessageSquare } from 'lucide-react';

const PostCard = ({ post, isAdminPost, onUpdated, onDeleted, onApprove, showManagementIcons = false }) => {
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const handleDelete = async () => {
    if (confirm('Xác nhận xóa?')) {
      try {
        await api.delete(`/admin/posts/${post._id}`);
        onDeleted(post._id);
      } catch (err) {
        alert('Lỗi xóa: ' + err.message);
      }
    }
  };

  const handleApproveClick = (approve) => {
    if (onApprove) onApprove(post._id, approve);
  };

  const handlePostUpdated = (updated) => {
    setLocalPost(updated);
    onUpdated(updated);
    setShowEdit(false);
  };

  return (
    <div className="post-card"> {/* Style giống Facebook: border, padding */}
      <div className="post-header">
        <img src={localPost.author.avatar || '/default-avatar.png'} alt="author" className="avatar" />
        <div>
          <h3>{localPost.author.name}</h3>
          <p>{new Date(localPost.createdAt).toLocaleString()}</p>
        </div>
        {isAdminPost && (
          <>
            <button onClick={() => setShowEdit(true)}><Edit2 size={16} /></button>
            <button onClick={handleDelete}><Trash2 size={16} /></button>
          </>
        )}
        {showManagementIcons && (
          <>
            {!localPost.isApproved && <button onClick={() => handleApproveClick(true)}><Check size={16} /> Duyệt</button>}
            <button onClick={() => handleApproveClick(false)}><X size={16} /> Từ chối</button>
            <button onClick={handleDelete}><Trash2 size={16} /> Xóa</button>
          </>
        )}
      </div>
      <p>{localPost.content}</p>
      <div className="post-images">
        {localPost.images.map((img, i) => <img key={i} src={img} alt={`img-${i}`} className="post-img" />)}
      </div>
      <div className="post-actions">
        <span>{localPost.likeCount} Likes</span>
        <button onClick={() => setShowComments(!showComments)}><MessageSquare size={16} /> Bình luận ({localPost.commentCount || 0})</button>
      </div>
      {showEdit && <CreatePostForm post={localPost} onPostCreated={handlePostUpdated} />}
      {showComments && <CommentList postId={localPost._id} isAdmin={true} />} {/* isAdmin để hiển thị quản lý comment */}
    </div>
  );
};

export default PostCard;