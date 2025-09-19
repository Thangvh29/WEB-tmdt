// src/components/admin/CommentList.jsx
import { useState, useEffect } from "react";
import api from "../../../services/axios";
import { Trash2, Check, X } from "lucide-react";

/**
 * CommentList (admin)
 * - Tương thích với backend khi routes được mount ở:
 *   1) /api/admin/posts/:postId/comments
 *   2) /api/admin/comments/posts/:postId/comments
 *   3) /api/admin/comments  (GET ?post=id  OR POST { post })
 */
const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  // apiStyle: 'postsRoute' | 'commentsPostsRoute' | 'commentsQueryRoute' | null
  const [apiStyle, setApiStyle] = useState(null);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchComments = async () => {
      setLoading(true);

      const candidates = [
        {
          name: "postsRoute",
          url: `/admin/posts/${postId}/comments`,
          opts: {},
        },
        {
          name: "commentsPostsRoute",
          url: `/admin/comments/posts/${postId}/comments`,
          opts: {},
        },
        {
          name: "commentsQueryRoute",
          url: `/admin/comments`,
          opts: { params: { post: postId } },
        },
      ];

      for (const c of candidates) {
        try {
          const res = await api.get(c.url, c.opts);
          // successful response -> use it
          if (mounted && res && (res.data || res.status === 200)) {
            // different backends may return { comments: [...] } or just array
            const payload = res.data;
            const gotComments = payload?.comments ?? payload;
            setComments(Array.isArray(gotComments) ? gotComments : []);
            setApiStyle(c.name);
            return; // done
          }
        } catch (err) {
          // If 404 -> try next candidate
          const status = err?.response?.status;
          // For client/server errors other than 404 we still try next candidate,
          // because some mounts return 500 for unsupported method but another mount may work.
          // But if it's network or auth error (401/403) break and show error.
          if (status === 401 || status === 403) {
            console.error("Auth error while fetching comments:", err);
            break;
          }
          // otherwise continue to next candidate
        }
      }

      // if we reach here: no candidate returned success
      if (mounted) {
        console.warn("Không tìm thấy endpoint comments phù hợp; trả về mảng rỗng");
        setComments([]);
      }
      setLoading(false);
    };

    fetchComments();

    return () => {
      mounted = false;
    };
  }, [postId]);

  // Helper: choose POST URL based on detected apiStyle (fallback tries)
  const postComment = async (content) => {
    // If we already discovered style, use it first
    const tryOrder = [];

    if (apiStyle === "postsRoute") {
      tryOrder.push({ url: `/admin/posts/${postId}/comments`, body: { content } });
    } else if (apiStyle === "commentsPostsRoute") {
      tryOrder.push({ url: `/admin/comments/posts/${postId}/comments`, body: { content } });
    } else if (apiStyle === "commentsQueryRoute") {
      tryOrder.push({ url: `/admin/comments`, body: { content, post: postId } });
    }

    // Always append safe fallbacks (in case apiStyle not known)
    tryOrder.push(
      { url: `/admin/posts/${postId}/comments`, body: { content } },
      { url: `/admin/comments/posts/${postId}/comments`, body: { content } },
      { url: `/admin/comments`, body: { content, post: postId } }
    );

    for (const attempt of tryOrder) {
      try {
        const res = await api.post(attempt.url, attempt.body);
        // success
        const payload = res.data;
        const added = payload?.comment ?? payload?.data ?? payload;
        // normalize: if returned object contains 'comment' or 'comment' field
        const commentObj = payload?.comment ?? (payload?.comment ? payload.comment : added);
        // push returned comment if present, else try to construct minimal
        if (commentObj && commentObj._id) {
          // set apiStyle if not set
          if (!apiStyle) {
            if (attempt.url.includes("/admin/posts/")) setApiStyle("postsRoute");
            else if (attempt.url.includes("/admin/comments/posts/")) setApiStyle("commentsPostsRoute");
            else if (attempt.url === "/admin/comments") setApiStyle("commentsQueryRoute");
          }
          return commentObj;
        }
        // If server returns different shape, try to pick a reasonable object
        if (res.data && res.data._id) return res.data;
        // otherwise continue to next attempt
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          throw err; // unauthorized/forbidden — bubble up
        }
        // else try next fallback
      }
    }

    // none succeeded
    throw new Error("Không gửi được comment đến server (tất cả endpoints thử thất bại)");
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const saved = await postComment(newComment.trim());
      // saved may be comment object or undefined
      if (saved && saved._id) {
        setComments((prev) => [saved, ...prev]);
        setNewComment("");
      } else {
        // fallback: show success message by refetching comments
        // (safe but slightly heavier)
        const { data } = await api.get(`/admin/posts/${postId}/comments`).catch(() => ({ data: null }));
        if (data?.comments) setComments((prev) => [...data.comments, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Lỗi thêm comment:", err);
      // if auth error, show specific message
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        alert("Bạn chưa được xác thực / không có quyền (401/403). Kiểm tra token/cookie.");
      } else {
        alert("Lỗi thêm comment. Kiểm tra console để biết chi tiết.");
      }
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Xóa comment?")) return;
    setActionLoading(commentId);
    try {
      await api.delete(`/admin/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Lỗi xóa comment");
    } finally {
      setActionLoading(null);
    }
  };

  // Approve / Reject comment
  const handleApproveComment = async (commentId, approve) => {
    setActionLoading(commentId);
    try {
      await api.patch(`/admin/comments/${commentId}`, { isApproved: approve });
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, isApproved: approve } : c)));
    } catch (err) {
      console.error("Lỗi duyệt:", err);
      alert("Lỗi duyệt comment");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <p>Đang tải comments...</p>;

  return (
    <div className="comment-list space-y-3">
      <h4 className="text-lg font-semibold">Bình luận</h4>

      {comments.length === 0 && <p className="text-gray-500">Chưa có bình luận nào.</p>}

      {comments.map((comment) => (
        <div key={comment._id} className="comment-item border p-2 rounded flex justify-between items-start">
          <div>
            <p>
              <strong>{comment.author?.name || "Ẩn danh"}:</strong> {comment.content}
            </p>
            <p className="text-sm text-gray-500">
              {comment.isApproved === true ? "✅ Đã duyệt" : comment.isApproved === false ? "❌ Từ chối" : "⏳ Chờ duyệt"}
            </p>
          </div>

          <div className="flex gap-2">
            {comment.isApproved !== true && (
              <button disabled={actionLoading === comment._id} onClick={() => handleApproveComment(comment._id, true)} className="text-green-600 flex items-center gap-1">
                <Check size={16} /> Duyệt
              </button>
            )}
            <button disabled={actionLoading === comment._id} onClick={() => handleApproveComment(comment._id, false)} className="text-yellow-600 flex items-center gap-1">
              <X size={16} /> Từ chối
            </button>
            <button disabled={actionLoading === comment._id} onClick={() => handleDeleteComment(comment._id)} className="text-red-600 flex items-center gap-1">
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </div>
      ))}

      <div className="add-comment flex gap-2 mt-4">
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Thêm bình luận..." className="border p-2 flex-1 rounded" />
        <button onClick={handleAddComment} className="bg-blue-500 text-white px-4 py-2 rounded">
          Gửi
        </button>
      </div>
    </div>
  );
};

export default CommentList;
