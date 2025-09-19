import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [modalItems, setModalItems] = useState([]); // những item sẽ thanh toán
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUnpaidOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/user/orders", {
          params: { page: 1, limit: 50 },
        });
        const unpaid = (data.orders || []).filter(
          (o) => o.paymentStatus !== "paid"
        );
        setOrders(unpaid);
      } catch (err) {
        console.error("Lỗi khi lấy đơn hàng chưa thanh toán:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnpaidOrders();
  }, []);

  const toggleSelect = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Mở modal thanh toán cho một order riêng
  const handlePayNow = (order) => {
    setModalItems([order]);
    setShowModal(true);
  };

  // Mở modal thanh toán tất cả các order đã chọn
  const handlePayAll = () => {
    const items = orders.filter((o) => selectedOrders.includes(o._id));
    setModalItems(items);
    setShowModal(true);
  };

  // Tổng tiền dựa vào modalItems
  const totalAmount = modalItems.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

  return (
    <div className="relative">
      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng chờ thanh toán.</p>
      ) : (
        orders.map((o) => (
          <PaymentItem
            key={o._id}
            order={o}
            selected={selectedOrders.includes(o._id)}
            onSelect={() => toggleSelect(o._id)}
            onPayNow={() => handlePayNow(o)}
          />
        ))
      )}

      {/* Thanh toán tất cả */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg">
          <div className="flex items-center gap-4">
            <span>Tổng: {orders
              .filter((o) => selectedOrders.includes(o._id))
              .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
              .toLocaleString()} đ
            </span>
            <button
              onClick={handlePayAll}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Thanh toán tất cả
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PaymentModal
          amount={totalAmount}
          onClose={() => setShowModal(false)}
          selectedItems={modalItems}
        />
      )}
    </div>
  );
};

export default PaymentTab;
