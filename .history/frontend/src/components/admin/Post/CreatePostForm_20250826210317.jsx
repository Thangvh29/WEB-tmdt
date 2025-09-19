// src/components/admin/Post/CreatePostForm.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../services/axios";

const CreatePostForm = ({ post, onPostCreated }) => {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const contentRef = useRef(null);
  const debounceTimer = useRef(null);

  const resizeContent = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeContent();
  }, [content, resizeContent]);

  const handleContentChange = useCallback(
    (e) => {
      const text = e.target.innerText.replace(/\n{2,}/g, "\n");
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setContent(text);
        resizeContent();
      }, 500);
    },
    [resizeContent]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertText", false, "\n");
      resizeContent();
    }
  };

  const handleContentFocus = () => {
    if (contentRef.current.innerText === "Bạn đang nghĩ gì thế?") { // Giống FB
      contentRef.current.innerText = "";
    }
  };

  const handleContentBlur = () => {
    if (!contentRef.current.innerText.trim()) {
      contentRef.current.innerText = "Bạn đang nghĩ gì thế?";
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerText = content || "Bạn đang nghĩ gì thế?";
    }
  }, [content]);

  const handleFileChange = (files) => {
    const newFiles = Array.from(files);
    setImages((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (url, index) => {
    URL.revokeObjectURL(url);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    const formData = new FormData();
    if (title) formData.append("title", title);
    formData.append("content", content);
    images.forEach((file) => formData.append("images", file));

    try {
      let res;
      if (post?._id) {
        res = await api.patch(`/admin/posts/${post._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/admin/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onPostCreated(res.data);

      setTitle("");
      setContent("");
      setImages([]);
      setPreviewUrls([]);
      if (contentRef.current) {
        contentRef.current.innerText = "Bạn đang nghĩ gì thế?";
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <form className="create-post-form p-4 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}> {/* Rounded giống FB */}
      <input
        type="text"
        placeholder="Tiêu đề (tùy chọn)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input mb-2 p-2 border border-gray-300 rounded w-full"
      />

      <div
        ref={contentRef}
        contentEditable="true"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
        className="content-input min-h-[100px] p-2 border border-gray-300 rounded w-full mb-2 text-[#050505]"
        data-placeholder="Bạn đang nghĩ gì thế?"
      />

      {/* Upload file */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="file-input mb-2"
      />

      {/* Preview ảnh */}
      {previewUrls.length > 0 && (
        <div
          className={`preview-grid mb-2 ${previewUrls.length === 1 ? "single" : "multi"}`}
        >
          {previewUrls.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`preview-${i}`} className="rounded-md" />
              <button
                type="button"
                className="remove-btn absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                onClick={() => handleRemoveImage(url, i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="submit" className="submit-btn w-full">
        {post ? "Cập nhật bài viết" : "Đăng bài"}
      </button>
    </form>
  );
};

export default CreatePostForm;