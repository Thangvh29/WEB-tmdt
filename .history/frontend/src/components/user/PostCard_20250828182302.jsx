// frontend/src/components/user/PostCard.jsx
import React, { useState } from 'react';
import api from '../../services/axios';
import CommentSection from './CommentSection';
import PostForm from './PostForm';
import AvatarMenu from './AvatarMenu';

const PostCard = ({ post, onUpdated, onDeleted }) => {
  const [liked, setLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = post.isOwner; // Giả định backend trả isOwner trong feed

  const handleLike = async () => {
    try {
      if (liked) {
        await api.post(`/user/posts/${post._id}/unlike`);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await api.post(`/user/posts/${post._id}/like`);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa bài viết?')) return;
    try {
      await api.delete(`/user/posts/${post._id}`);
      onDeleted(post._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = () => setEditing(true);

  const handleUpdated = (updatedPost) => {
    setEditing(false);
    onUpdated(updatedPost);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div onClick={() => setShowMenu(true)} className="avatar">
          <img src={post.author.avatar || '/default-avatar.png'} alt={post.author.name} />
          <span>{post.author.name}</span>
        </div>
        {showMenu && <AvatarMenu postId={post._id} authorId={post.author._id} onClose={() => setShowMenu(false)} />}
        {isOwner && (
          <div className="actions">
            <button onClick={handleEdit}>Chỉnh sửa</button>
            <button onClick={handleDelete}>Xóa</button>
          </div>
        )}
      </div>
      {editing ? (
        <PostForm postToEdit={post} onPostUpdated={handleUpdated} />
      ) : (
        <>
          <p>{post.content}</p>
          <div className="images">
            {post.images.map((img, i) => <img key={i} src={img} alt="post" />)}
          </div>
          <button onClick={handleLike}>{liked ? 'Bỏ tim' : 'Tim'}</button>
          <span>{likeCount} tim</span>
          <button onClick={() => setShowComments(!showComments)}>Bình luận</button>
          {showComments && <CommentSection postId={post._id} />}
        </>
      )}
    </div>
  );
};

export default PostCard;