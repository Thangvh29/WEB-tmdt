import React from "react";
import "../../../assets/style/payment-item.css";

const PaymentItem = ({ order, selected, onSelect, onPayNow }) => {
  const firstItem = order.firstItem || {};

  return (
    <div className="payment-item">
      <div className="col chk">
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </div>

      <div className="col product">
        <img
          src={firstItem.image || "/default-product.png"}
          alt={firstItem.name || "Sản phẩm"}
          className="thumb"
        />
        <div className="info">
          <div className="name">{firstItem.name || "Sản phẩm"}</div>
          <div className="qty">Số lượng: {firstItem.qty || 0}</div>
          <div className="date">{new Date(order.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="col total">
        <div className="amount">{order.totalAmount?.toLocaleString() || 0} đ</div>
        <button className="pay-btn" onClick={onPayNow}>
          Thanh toán
        </button>
      </div>
    </div>
  );
};

export default PaymentItem;
