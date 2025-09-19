// frontend/src/components/admin/Orders/OrderDetailModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, ListGroup, Badge } from 'react-bootstrap';

const OrderDetailModal = ({ order, onClose, onUpdateStatus, onUpdateCustomerInfo, isHistory = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [updatedInfo, setUpdatedInfo] = useState({
    phone: order.phone,
    shippingAddress: order.shippingAddress,
    email: order.email,
    note: order.note || '',
  });

  const handleChange = (e) => {
    setUpdatedInfo({ ...updatedInfo, [e.target.name]: e.target.value });
  };

  const saveCustomerInfo = () => {
    onUpdateCustomerInfo(order._id, updatedInfo);
    setEditMode(false);
  };

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết đơn hàng: {order._id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>Thông tin khách hàng</h5>
        {editMode ? (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>SĐT</Form.Label>
              <Form.Control name="phone" value={updatedInfo.phone} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ giao hàng</Form.Label>
              <Form.Control name="shippingAddress" value={updatedInfo.shippingAddress} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" value={updatedInfo.email} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control name="note" value={updatedInfo.note} onChange={handleChange} as="textarea" rows={2} />
            </Form.Group>
            <Button variant="primary" onClick={saveCustomerInfo}>Lưu thay đổi</Button>
            <Button variant="secondary" onClick={() => setEditMode(false)} className="ms-2">Hủy</Button>
          </Form>
        ) : (
          <>
            <p><strong>Tên:</strong> {order.user?.name || 'Khách vãng lai'}</p>
            <p><strong>SĐT:</strong> {order.phone}</p>
            <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
            <p><strong>Email:</strong> {order.email}</p>
            <p><strong>Ghi chú:</strong> {order.note || 'Không có'}</p>
            {!isHistory && <Button variant="outline-info" size="sm" onClick={() => setEditMode(true)}>Sửa thông tin</Button>}
          </>
        )}

        <h5 className="mt-4">Danh sách sản phẩm</h5>
        <ListGroup>
          {order.items.map((item, i) => (
            <ListGroup.Item key={i}>
              {item.name || item.product.name} - Số lượng: {item.quantity} - Giá: {item.price.toLocaleString()} ₫
            </ListGroup.Item>
          ))}
        </ListGroup>

        <h5 className="mt-4">Trạng thái</h5>
        <Badge bg="info">{order.status}</Badge>
        {order.statusHistory && (
          <ListGroup className="mt-2">
            {order.statusHistory.map((hist, i) => (
              <ListGroup.Item key={i}>
                {hist.status} - {new Date(hist.at).toLocaleString()} {hist.note ? `(Ghi chú: ${hist.note})` : ''}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        {!isHistory && (
          <Button variant="outline-primary" onClick={() => onUpdateStatus(order._id, 'delivered')}>Giao thành công</Button>
        )}
        {!isHistory && (
          <Button variant="outline-danger" onClick={() => onUpdateStatus(order._id, 'failed', prompt('Ghi chú thất bại:'))}>Giao thất bại</Button>
        )}
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetailModal;