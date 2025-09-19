import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../services/axios";

const CreatePostForm = ({ post, onPostCreated }) => {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState([]); // nhiều file ảnh
  const [previewUrls, setPreviewUrls] = useState([]); // preview ảnh
  const contentRef = useRef(null);
  const debounceTimer = useRef(null);

  // Auto-resize cho content div
  const resizeContent = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeContent();
  }, [content, resizeContent]);

  // Xử lý nhập liệu với debounce
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

  // Keydown để không chèn div khi Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertText", false, "\n");
      resizeContent();
    }
  };

  // Focus/Blur xử lý placeholder
  const handleContentFocus = () => {
    if (contentRef.current.innerText === "Bạn đang nghĩ gì?") {
      contentRef.current.innerText = "";
    }
  };
  const handleContentBlur = () => {
    if (!contentRef.current.innerText.trim()) {
      contentRef.current.innerText = "Bạn đang nghĩ gì?";
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerText = content || "Bạn đang nghĩ gì?";
    }
  }, [content]);

  // Upload file
  const handleFileChange = (files) => {
    const fileArray = Array.from(files);
    setImages(fileArray);
    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  // Xóa ảnh khỏi preview
  const handleRemoveImage = (url, index) => {
    const newPreviews = previewUrls.filter((u, i) => i !== index);
    const newFiles = images.filter((_, i) => i !== index);
    setPreviewUrls(newPreviews);
    setImages(newFiles);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append(
      "content",
      content.trim() === "Bạn đang nghĩ gì?" ? "" : content
    );

    if (images.length > 0) {
      images.forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const res = post
        ? await api.put(`/admin/posts/${post._id}`, formData)
        : await api.post("/admin/posts", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      onPostCreated(res.data);

      // reset
      setTitle("");
      setContent("");
      setImages([]);
      setPreviewUrls([]);
      if (contentRef.current) {
        contentRef.current.innerText = "Bạn đang nghĩ gì?";
      }
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

      <div
        ref={contentRef}
        contentEditable="true"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
        className="content-input"
        data-placeholder="Bạn đang nghĩ gì?"
      />

      {/* Upload file */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="file-input"
      />

      {/* Preview ảnh */}
      {previewUrls.length > 0 && (
        <div
          className={`preview-grid ${
            previewUrls.length === 1 ? "single" : "multi"
          }`}
        >
          {previewUrls.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`preview-${i}`} />
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveImage(url, i)}
              >
                ✕
              </button>
            </div>
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
