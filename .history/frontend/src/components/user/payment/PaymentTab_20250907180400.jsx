// frontend/src/components/user/payment/PaymentTab.jsx
import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [payments, setPayments] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await api.get("/user/payments");
        setPayments(data.payments || []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách thanh toán:", err);
      }
    };
    fetchPayments();
  }, []);

  const toggleSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Tính tổng tiền các payment đã chọn
  const totalAmount = payments
    .filter((p) => selectedItems.includes(p._id))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="relative">
      {payments.length === 0 ? (
        <p>Không có yêu cầu thanh toán nào.</p>
      ) : (
        payments.map((p) => (
          <PaymentItem
            key={p._id}
            item={p}
            selected={selectedItems.includes(p._id)}
            onSelect={() => toggleSelect(p._id)}
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
          selectedItems={payments.filter((p) => selectedItems.includes(p._id))}
        />
      )}
    </div>
  );
};

export default PaymentTab;
