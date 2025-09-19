import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [orders, setOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/user/orders?status=approved"); // giả định endpoint
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng:", err);
      }
    };
    fetchOrders();
  }, []);

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const totalAmount = orders.reduce((sum, order) => {
    return (
      sum +
      order.items
        .filter((i) => selectedItems.includes(i._id))
        .reduce((s, i) => s + i.quantity * i.product.price, 0)
    );
  }, 0);

  return (
    <div className="relative">
      {orders.map((order) =>
        order.items.map((item) => (
          <PaymentItem
            key={item._id}
            item={item}
            selected={selectedItems.includes(item._id)}
            onSelect={() => toggleSelect(item._id)}
            onPayNow={() => setShowModal(true)}
          />
        ))
      )}

      {/* Thanh toán tất cả */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg">
          <div className="flex items-center gap-4">
            <span>Tổng: {totalAmount.toLocaleString()} đ</span>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Thanh toán tất cả
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <PaymentModal
          amount={totalAmount}
          onClose={() => setShowModal(false)}
          selectedItems={selectedItems}
        />
      )}
    </div>
  );
};

export default PaymentTab;
