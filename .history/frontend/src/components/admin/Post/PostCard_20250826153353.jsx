import React from "react";
import { ThumbsUp, CheckCircle, XCircle, Trash2, Edit } from "lucide-react";

const PostCard = ({
  post,
  isAdminPost = false, // true = bài admin, false = bài user
  onApprove,
  onDeleted,
  onUpdated,
  showManagementIcons = false,
}) => {
  const handleApprove = (approve) => {
    if (onApprove) onApprove(post._id, approve);
  };

  const handleDelete = () => {
    if (onDeleted && window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      onDeleted(post._id);
    }
  };

  return (
    <div className="card post-card shadow-sm">
      {/* Ảnh bài viết */}
      {post.images?.length > 0 && (
        <img
          src={post.images[0] || "/no-image.png"}
          className="card-img-top"
          alt={post.title || "Ảnh bài đăng"}
        />
      )}

      <div className="card-body d-flex flex-column">
        {/* Tiêu đề */}
        <h6 className="card-title multiline-title" title={post.title}>
          {post.title || "Không có tiêu đề"}
        </h6>

        {/* Nội dung ngắn */}
        {post.content && (
          <p className="card-text small text-muted mb-2 line-clamp-3">
            {post.content}
          </p>
        )}

        {/* Thông tin tác giả */}
        <p className="small text-muted mb-1">
          Tác giả: <strong>{post.author?.name || "Ẩn danh"}</strong>
        </p>

        {/* Trạng thái duyệt */}
        <span
          className={`badge ${
            post.isApproved ? "bg-success" : "bg-warning text-dark"
          } mb-2`}
        >
          {post.isApproved ? "Đã duyệt" : "Chờ duyệt"}
        </span>

        {/* Like count */}
        <div className="d-flex align-items-center mb-2">
          <ThumbsUp size={16} className="me-1 text-primary" />
          <span>{post.likes?.length || 0} lượt thích</span>
        </div>

        {/* Nút hành động */}
        <div className="mt-auto d-flex justify-content-between gap-2">
          {isAdminPost ? (
            <>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onUpdated?.(post)}
              >
                <Edit size={14} className="me-1" />
                Sửa
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDelete}
              >
                <Trash2 size={14} className="me-1" />
                Xóa
              </button>
            </>
          ) : showManagementIcons ? (
            <>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => handleApprove(true)}
              >
                <CheckCircle size={14} className="me-1" />
                Duyệt
              </button>
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={() => handleApprove(false)}
              >
                <XCircle size={14} className="me-1" />
                Từ chối
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDelete}
              >
                <Trash2 size={14} className="me-1" />
                Xóa
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
