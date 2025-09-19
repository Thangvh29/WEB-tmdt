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
import "../../assets/style/post-card.css"; // ✅ dùng chung CSS với admin

const PostCard = ({ post, onUpdated, onDeleted }) => {
  const [liked, setLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = post.isOwner;

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
            <p className="font-semibold text-gray-800">{post.author.name}</p>
            <span className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-100"
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
                <div className="flex flex-col text-sm">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  >
                    <Pencil size={16} /> Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-gray-100"
                  >
                    <Trash size={16} /> Xóa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nội dung */}
      <div className="mt-3">
        {editing ? (
          <PostForm postToEdit={post} onPostUpdated={handleUpdated} />
        ) : (
          <>
            <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
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
        <div className="flex items-center justify-between mt-4 text-gray-600">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 ${
              liked ? "text-red-500" : "hover:text-red-500"
            }`}
          >
            <Heart
              size={20}
              fill={liked ? "currentColor" : "none"}
              strokeWidth={2}
            />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments((prev) => !prev)}
            className="flex items-center gap-1 hover:text-blue-500"
          >
            <MessageCircle size={20} />
            <span>Bình luận</span>
          </button>
        </div>
      )}

      {/* Comment section */}
      {showComments && (
        <div className="mt-3">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
