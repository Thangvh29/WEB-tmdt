// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import api from "../../../services/axios";
import ProductForm from "./ProductForm";

const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
    } catch {
      console.error("Lỗi tải sản phẩm");
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?productId=${productId}`);
      setReviews(data.reviews);
    } catch {
      console.error("Lỗi tải đánh giá");
    }
  };

  const handleApproveReview = async (reviewId) => {
    await api.patch(`/admin/reviews/${reviewId}`, { approved: true });
    fetchReviews();
  };

  const handleDeleteReview = async (reviewId) => {
    await api.delete(`/admin/reviews/${reviewId}`);
    fetchReviews();
  };

  const handleReplyReview = async (reviewId, reply) => {
    if (!reply.trim()) return;
    await api.post(`/admin/reviews/${reviewId}/reply`, { reply });
    fetchReviews();
  };

  if (!product) return <div>Loading...</div>;

  if (editing) {
    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chỉnh sửa sản phẩm</h5>
              <button type="button" className="btn-close" onClick={() => setEditing(false)} />
            </div>
            <div className="modal-body">
              <ProductForm
                productId={productId}
                onSubmitSuccess={() => {
                  setEditing(false);
                  fetchProduct();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title">{product.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">

            {/* Thông tin cơ bản */}
            <h6 className="mb-2">📌 Thông tin cơ bản</h6>
            <div className="row mb-3">
              <div className="col-md-6"><strong>Hãng:</strong> {product.brand}</div>
              <div className="col-md-6"><strong>Loại:</strong> {product.type}</div>
              <div className="col-md-6"><strong>Danh mục:</strong> {product.category?.name}</div>
              <div className="col-md-6"><strong>Giá cơ bản:</strong> {product.price?.toLocaleString()} ₫</div>
              <div className="col-md-6"><strong>Tình trạng:</strong> {product.isNewProduct ? "Mới" : "Cũ"}</div>
              <div className="col-md-6"><strong>Tồn kho tổng:</strong> {product.stock}</div>
              <div className="col-md-6"><strong>Đánh giá TB:</strong> ⭐ {product.rating?.toFixed(1) || 0} / 5</div>
              <div className="col-md-6"><strong>Lượt đánh giá:</strong> {reviews.length}</div>
            </div>

            {/* Ảnh sản phẩm */}
            <h6 className="mb-2">🖼 Ảnh sản phẩm</h6>
            <div className="row mb-3">
              {product.images.map((img, i) => (
                <div key={i} className="col-md-3 mb-2">
                  <img src={img} alt="" className="img-fluid rounded border" />
                </div>
              ))}
            </div>

            {/* Phiên bản */}
            {product.variants?.length > 0 && (
              <>
                <h6 className="mb-2">⚙️ Phiên bản</h6>
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Version</th>
                      <th>Màu</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, index) => (
                      <tr key={index}>
                        <td>{v.attributes.find(a => a.name === "version")?.value}</td>
                        <td>{v.attributes.find(a => a.name === "color")?.value}</td>
                        <td>{v.price.toLocaleString()} ₫</td>
                        <td>{v.stock}</td>
                        <td>
                          {v.images.length > 0 ? (
                            <img
                              src={v.images[0]}
                              alt="variant"
                              className="img-thumbnail"
                              style={{ maxHeight: "60px" }}
                            />
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Specs */}
            {product.specs?.length > 0 && (
              <>
                <h6 className="mb-2">📑 Thông số kỹ thuật</h6>
                <ul className="list-group mb-3">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between">
                      <span>{spec.key}</span>
                      <span className="fw-bold">{spec.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Commitments */}
            {product.commitments?.length > 0 && (
              <>
                <h6 className="mb-2">✅ Cam kết</h6>
                <ul className="list-group mb-3">
                  {product.commitments.map((commit, i) => (
                    <li key={i} className="list-group-item">{commit}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Description */}
            {product.description && (
              <>
                <h6 className="mb-2">📝 Mô tả</h6>
                <p>{product.description}</p>
              </>
            )}

            {/* Reviews */}
            <h6 className="mb-2">⭐ Đánh giá khách hàng</h6>
            {reviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
            {reviews.map((review) => (
              <div key={review._id} className="border rounded p-2 mb-2">
                <p className="mb-1"><strong>{review.user?.name}:</strong> {review.content}</p>
                <small className="text-muted">⭐ {review.rating} / 5</small>
                <div className="d-flex gap-2 mt-2">
                  {!review.approved && (
                    <button className="btn btn-sm btn-success" onClick={() => handleApproveReview(review._id)}>Duyệt</button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReview(review._id)}>Xóa</button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Trả lời..."
                    onKeyDown={(e) => e.key === "Enter" && handleReplyReview(review._id, e.target.value)}
                  />
                </div>
              </div>
            ))}

          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Chỉnh sửa</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
