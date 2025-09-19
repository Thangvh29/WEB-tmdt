// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';
import ProductForm from './ProductForm';

const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false); // toggle form edit

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
    } catch {
      console.error('Lỗi tải sản phẩm');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?productId=${productId}`);
      setReviews(data.reviews);
    } catch {
      console.error('Lỗi tải đánh giá');
    }
  };

  // handlers review
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

  // Nếu đang chỉnh sửa thì render ProductForm
  if (editing) {
    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chỉnh sửa sản phẩm</h5>
              <button type="button" className="btn-close" onClick={() => setEditing(false)}></button>
            </div>
            <div className="modal-body">
              <ProductForm
                productId={productId}
                onSubmitSuccess={() => {
                  setEditing(false);
                  fetchProduct(); // reload lại sau khi sửa
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mặc định hiển thị chi tiết
  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{product.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Thông tin cơ bản */}
            <h6>Thông tin cơ bản</h6>
            <div className="row mb-3">
              <div className="col-md-6"><strong>Hãng:</strong> {product.brand}</div>
              <div className="col-md-6"><strong>Loại:</strong> {product.type}</div>
              <div className="col-md-6"><strong>Giá cơ bản:</strong> {product.price?.toLocaleString()} ₫</div>
              <div className="col-md-6"><strong>Tình trạng:</strong> {product.condition || (product.isNewProduct ? 'Mới' : 'Cũ')}</div>
              <div className="col-md-6"><strong>Tồn kho tổng:</strong> {product.stock || 'N/A'}</div>
            </div>

            {/* Ảnh */}
            <h6>Ảnh sản phẩm</h6>
            <div className="row mb-3">
              {product.images.map((img, i) => (
                <div key={i} className="col-md-3 mb-2">
                  <img src={img} alt="" className="img-fluid rounded" />
                </div>
              ))}
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <>
                <h6>Phiên bản</h6>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Color</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, index) => (
                      <tr key={index}>
                        <td>{v.attributes.find(a => a.name === 'version')?.value}</td>
                        <td>{v.attributes.find(a => a.name === 'color')?.value}</td>
                        <td>{v.price.toLocaleString()} ₫</td>
                        <td>{v.stock}</td>
                        <td>{v.images.length} ảnh</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Specs */}
            <h6>Thông số kỹ thuật</h6>
            <ul className="list-group mb-3">
              {product.specs.map((spec, i) => (
                <li key={i} className="list-group-item">
                  <strong>{spec.key}:</strong> {spec.value}
                </li>
              ))}
            </ul>

            {/* Commitments */}
            <h6>Cam kết</h6>
            <ul className="list-group mb-3">
              {product.commitments.map((commit, i) => (
                <li key={i} className="list-group-item">{commit}</li>
              ))}
            </ul>

            {/* Description */}
            <h6>Mô tả</h6>
            <p>{product.description}</p>

            {/* Reviews */}
            <h6>Đánh giá khách hàng</h6>
            {reviews.map((review) => (
              <div key={review._id} className="border rounded p-2 mb-2">
                <p>{review.content}</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success" onClick={() => handleApproveReview(review._id)}>Duyệt</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReview(review._id)}>Xóa</button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Trả lời..."
                    onKeyDown={(e) => e.key === 'Enter' && handleReplyReview(review._id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Chỉnh sửa toàn bộ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
