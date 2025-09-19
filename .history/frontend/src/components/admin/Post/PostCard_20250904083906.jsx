import React, { useState } from "react";
import api from "../../services/axios";
import CommentSection from "./CommentSection";
import PostForm from "./PostForm";
import AvatarMenu from "./AvatarMenu";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react";
import "../../assets/style/post-card.css"; // ✅ Dùng chung CSS với admin

const PostCard = ({ post, onUpdated, onDeleted }) => {
  const [liked, setLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = post.isOwner; // backend trả về

  const handleLike = async () => {
    try {
      if (liked) {
        await api.post(`/user/posts/${post._id}/unlike`);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await api.post(`/user/posts/${post._id}/like`);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa bài viết?")) return;
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
      {/* Header */}
      <div className="post-header">
        <div className="avatar">
          <img
            src={post.author.avatar || "/default-avatar.png"}
            alt={post.author.name}
          />
          <div>
            <span className="name">{post.author.name}</span>
            <br />
            <span className="time">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="menu-btn"
          >
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="avatar-menu">
              <AvatarMenu
                postId={post._id}
                authorId={post.author._id}
                onClose={() => setShowMenu(false)}
              />
              {isOwner && (
                <>
                  <button onClick={handleEdit}>
                    <Pencil size={16} /> Chỉnh sửa
                  </button>
                  <button onClick={handleDelete} className="text-red-600">
                    <Trash size={16} /> Xóa
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="post-content">
        {editing ? (
          <PostForm postToEdit={post} onPostUpdated={handleUpdated} />
        ) : (
          <>
            <p>{post.content}</p>
            {post.images?.length > 0 && (
              <div className="images">
                {post.images.map((img, i) => (
                  <img key={i} src={img} alt={`post-${i}`} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="actions">
          <button
            onClick={handleLike}
            className={liked ? "text-red-500" : ""}
          >
            <Heart
              size={18}
              fill={liked ? "currentColor" : "none"}
              strokeWidth={2}
            />{" "}
            {likeCount}
          </button>

          <button onClick={() => setShowComments((prev) => !prev)}>
            <MessageCircle size={18} /> Bình luận
          </button>
        </div>
      )}

      {/* Comment Section */}
      {showComments && (
        <div className="comments-section">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
