// src/components/admin/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';
import { Pencil } from 'lucide-react'; // Import nếu dùng lucide, hoặc bỏ nếu dùng Bootstrap icon

const ProductDetail = ({ productId, onClose, onEdit }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editingField, setEditingField] = useState(null); // State cho edit inline (field name)
  const [formValues, setFormValues] = useState({}); // State tạm cho giá trị edit

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setProduct(data);
      setFormValues(data); // Khởi tạo formValues từ data
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

  // Hàm save edit inline
  const saveEdit = async (field) => {
    try {
      await api.patch(`/admin/products/${productId}`, { [field]: formValues[field] });
      fetchProduct(); // Reload data
      setEditingField(null); // Exit edit mode
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
    }
  };

  // Hàm thay đổi giá trị edit
  const handleChange = (e, field) => {
    setFormValues({ ...formValues, [field]: e.target.value });
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
            {/* Thông tin cơ bản - Thêm đầy đủ từ form add */}
            <h6>Thông tin cơ bản</h6>
            <div className="row mb-3">
              <div className="col-md-6">
                <p><strong>Tên:</strong> {editingField === 'name' ? (
                  <input value={formValues.name} onChange={(e) => handleChange(e, 'name')} />
                ) : product.name} <Pencil size={16} onClick={() => setEditingField('name')} className="edit-icon ms-2" /></p>
                {editingField === 'name' && <button className="btn btn-sm btn-primary" onClick={() => saveEdit('name')}>Lưu</button>}
              </div>
              <div className="col-md-6">
                <p><strong>Hãng:</strong> {editingField === 'brand' ? (
                  <input value={formValues.brand} onChange={(e) => handleChange(e, 'brand')} />
                ) : product.brand} <Pencil size={16} onClick={() => setEditingField('brand')} className="edit-icon ms-2" /></p>
                {editingField === 'brand' && <button className="btn btn-sm btn-primary" onClick={() => saveEdit('brand')}>Lưu</button>}
              </div>
              <div className="col-md-6">
                <p><strong>Loại:</strong> {product.type}</p> {/* Không edit nếu không cần */}
              </div>
              <div className="col-md-6">
                <p><strong>Giá cơ bản:</strong> {product.price.toLocaleString()} ₫ <Pencil size={16} onClick={() => setEditingField('price')} className="edit-icon ms-2" /></p>
                {editingField === 'price' && (
                  <>
                    <input type="number" value={formValues.price} onChange={(e) => handleChange(e, 'price')} />
                    <button className="btn btn-sm btn-primary" onClick={() => saveEdit('price')}>Lưu</button>
                  </>
                )}
              </div>
              <div className="col-md-6">
                <p><strong>Tình trạng:</strong> {product.condition} <Pencil size={16} onClick={() => setEditingField('condition')} className="edit-icon ms-2" /></p>
                {editingField === 'condition' && (
                  <>
                    <select value={formValues.condition} onChange={(e) => handleChange(e, 'condition')}>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                    <button className="btn btn-sm btn-primary" onClick={() => saveEdit('condition')}>Lưu</button>
                  </>
                )}
              </div>
              <div className="col-md-6">
                <p><strong>Tồn kho tổng:</strong> {product.stock || 'N/A'}</p>
              </div>
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

            {/* Variants - Hiển thị dưới dạng table */}
            {product.variants?.length > 0 && (
              <div className="mb-3">
                <h6>Phiên bản</h6>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Color</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Ảnh</th>
                      <th>Edit</th>
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
                        <td><Pencil size={16} onClick={() => onEdit(product._id, index)} className="edit-icon" /></td> {/* Edit variant cụ thể */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Thông số kỹ thuật */}
            <h6>Thông số kỹ thuật</h6>
            <ul className="list-group mb-3">
              {product.specs.map((spec, i) => (
                <li key={i} className="list-group-item">
                  <strong>{spec.key}:</strong> {spec.value} <Pencil size={16} onClick={() => setEditingField(`specs.${i}`)} className="edit-icon ms-2" />
                </li>
              ))}
            </ul>

            {/* Cam kết */}
            <h6>Cam kết</h6>
            <ul className="list-group mb-3">
              {product.commitments.map((commit, i) => (
                <li key={i} className="list-group-item">{commit} <Pencil size={16} onClick={() => setEditingField(`commitments.${i}`)} className="edit-icon ms-2" /></li>
              ))}
            </ul>

            {/* Mô tả */}
            <h6>Mô tả</h6>
            <p>{product.description} <Pencil size={16} onClick={() => setEditingField('description')} className="edit-icon ms-2" /></p>
            {editingField === 'description' && (
              <>
                <textarea value={formValues.description} onChange={(e) => handleChange(e, 'description')} rows="3" />
                <button className="btn btn-sm btn-primary" onClick={() => saveEdit('description')}>Lưu</button>
              </>
            )}

            {/* Đánh giá */}
            <h6>Đánh giá khách hàng</h6>
            {reviews.map((review) => (
              <div key={review._id} className="border rounded p-2 mb-2">
                <p>{review.content}</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success" onClick={() => handleApproveReview(review._id)}>Duyệt</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReview(review._id)}>Xóa</button>
                  <input type="text" className="form-control form-control-sm" placeholder="Trả lời..." onKeyDown={(e) => e.key === 'Enter' && handleReplyReview(review._id, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={() => onEdit(product._id)}>Chỉnh sửa toàn bộ</button> {/* Giữ button edit full */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;