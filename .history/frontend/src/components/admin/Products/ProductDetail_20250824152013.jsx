// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';

const ProductDetail = ({ productId, onClose, onEdit }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
    } catch (err) {
      console.error('Lỗi tải sản phẩm');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?productId=${productId}`);
      setReviews(data.reviews);
    } catch  {
      console.error('Lỗi tải đánh giá');
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
    await api.post(`/admin/reviews/${reviewId}/reply`, { reply });
    fetchReviews();
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{product.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              {product.images.map((img, i) => (
                <div key={i} className="col-md-3 mb-2">
                  <img src={img} alt="" className="img-fluid rounded" />
                </div>
              ))}
            </div>

            <h6>Thông số kỹ thuật</h6>
            <ul className="list-group mb-3">
              {product.specs.map((spec, i) => (
                <li key={i} className="list-group-item">
                  <strong>{spec.key}:</strong> {spec.value}
                </li>
              ))}
            </ul>

            <h6>Cam kết</h6>
            <ul className="list-group mb-3">
              {product.commitments.map((commit, i) => (
                <li key={i} className="list-group-item">{commit}</li>
              ))}
            </ul>

            <h6>Mô tả</h6>
            <p>{product.description}</p>

            <h6>Đánh giá khách hàng</h6>
            {reviews.map((review) => (
              <div key={review._id} className="border rounded p-2 mb-2">
                <p>{review.content}</p>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleApproveReview(review._id)}
                  >
                    Duyệt
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteReview(review._id)}
                  >
                    Xóa
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Trả lời..."
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleReplyReview(review._id, e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={onEdit}>Chỉnh sửa</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
