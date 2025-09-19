import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../services/axios";

const CreatePostForm = ({ post, onPostCreated }) => {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const textareaRef = useRef(null);

  // Optimize auto-resize with debouncing
  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [content, resizeTextarea]);

  // Handle content change with focus preservation
  const handleContentChange = (e) => {
    setContent(e.target.value);
    // Ensure cursor stays in place
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  };

  const handleFileChange = (files) => {
    setImages(files);
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const res = post
        ? await api.put(`/api/posts/${post._id}`, formData)
        : await api.post("/api/posts", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      onPostCreated(res.data);
      setTitle("");
      setContent("");
      setImages(null);
      setPreviewUrls([]);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tiêu đề (tùy chọn)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input"
      />
      <textarea
        ref={textareaRef}
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={handleContentChange}
        className="content-input"
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="file-input"
      />
      {previewUrls.length > 0 && (
        <div
          className={`preview-grid ${previewUrls.length === 1 ? "single" : "multi"}`}
        >
          {previewUrls.map((url, i) => (
            <img key={i} src={url} alt={`preview-${i}`} />
          ))}
        </div>
      )}
      <button type="submit" className="submit-btn">
        {post ? "Cập nhật bài viết" : "Đăng bài"}
      </button>
    </form>
  );
};

export default CreatePostForm;