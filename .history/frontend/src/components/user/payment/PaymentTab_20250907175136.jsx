import { useState, useEffect } from "react";
import api from "../../../services/axios";
import PaymentItem from "./PaymentItem";
import PaymentModal from "./PaymentModal";

const PaymentTab = () => {
  const [items, setItems] = useState([]); // giỏ hàng hoặc order chưa thanh toán
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        // giả sử API trả về order items chưa thanh toán
        const { data } = await api.get("/user/orders?status=pending");
        setItems(data.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy giỏ hàng:", err);
      }
    };
    fetchCart();
  }, []);

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePayNow = (id) => {
    setSelectedItems([id]);
    setShowModal(true);
  };

  const handleBulkPay = () => {
    if (selectedItems.length > 0) setShowModal(true);
  };

  const totalAmount = items
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  return (
    <div>
      {items.map((item) => (
        <PaymentItem
          key={item.id}
          item={item}
          selected={selectedItems.includes(item.id)}
          onSelect={() => toggleSelect(item.id)}
          onPayNow={() => handlePayNow(item.id)}
        />
      ))}

      {selectedItems.length > 1 && (
        <button
          onClick={handleBulkPay}
          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Thanh toán {selectedItems.length} sản phẩm ({totalAmount.toLocaleString()} đ)
        </button>
      )}

      {showModal && (
        <PaymentModal
          amount={totalAmount}
          selectedItems={items.filter((i) => selectedItems.includes(i.id))}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentTab;
