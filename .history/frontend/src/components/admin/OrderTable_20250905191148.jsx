// frontend/src/components/admin/Orders/OrderTable.jsx
import React from 'react';
import { Table, Badge, Button, Dropdown } from 'react-bootstrap'; // Giả sử dùng Bootstrap

const OrderTable = ({ orders, onViewDetail, onUpdateStatus, showFailureReason = false }) => {
  const statusMap = {
    pending: { label: 'Chờ duyệt', color: 'warning' },
    preparing: { label: 'Đang chuẩn bị', color: 'info' },
    shipped: { label: 'Đã giao cho vận chuyển', color: 'primary' },
    delivered: { label: 'Giao thành công', color: 'success' },
    failed: { label: 'Giao thất bại', color: 'danger' },
    cancelled: { label: 'Đã hủy', color: 'secondary' },
  };

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>ID Đơn</th>
          <th>Khách hàng</th>
          <th>Địa chỉ</th>
          <th>SĐT</th>
          <th>Email</th>
          <th>Sản phẩm</th>
          <th>Trạng thái</th>
          {showFailureReason && <th>Lý do thất bại</th>}
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order._id}>
            <td>{order._id}</td>
            <td>{order.user?.name || 'Khách vãng lai'}</td>
            <td>{order.shippingAddress}</td>
            <td>{order.phone}</td>
            <td>{order.email}</td>
            <td>
              <ul className="mb-0">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.name || item.product.name} x {item.quantity}
                  </li>
                ))}
              </ul>
            </td>
            <td>
              <Badge bg={statusMap[order.status]?.color}>{statusMap[order.status]?.label}</Badge>
            </td>
            {showFailureReason && (
              <td>
                {order.status === 'failed' || order.status === 'cancelled'
                  ? order.statusHistory?.find(h => h.status === order.status)?.note || 'Không có ghi chú'
                  : '-'}
              </td>
            )}
            <td>
              <Button variant="outline-primary" size="sm" onClick={() => onViewDetail(order)}>
                Chi tiết
              </Button>
              {!showFailureReason && (
                <Dropdown className="d-inline ms-2" drop="up">
                  <Dropdown.Toggle variant="outline-secondary" size="sm">Cập nhật trạng thái</Dropdown.Toggle>
                  <Dropdown.Menu>
                    {Object.entries(statusMap).map(([key, { label }]) => (
                      <Dropdown.Item key={key} onClick={() => onUpdateStatus(order._id, key)}>
                        {label}
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Item onClick={() => onUpdateStatus(order._id, 'failed', prompt('Ghi chú thất bại:'))}>
                      Giao thất bại (với ghi chú)
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default OrderTable;