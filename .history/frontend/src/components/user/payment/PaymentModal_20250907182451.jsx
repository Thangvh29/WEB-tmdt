import api from "../../../services/axios";
import "../../../assets/style/payment-modal.css";

const PaymentModal = ({ amount, onClose, selectedItems }) => {
  const methods = ["VNPay", "ZaloPay", "Ngân hàng"];

  const handleConfirm = async (method) => {
    try {
      const payload = {
        method,
        amount,
        items: selectedItems.map((i) => ({
          itemId: i._id,
          quantity: i.quantity,
          price: i.product.price,
        })),
      };

      const { data } = await api.post("/user/payments", payload);

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        console.log("Thanh toán thành công:", data);
      }
    } catch (err) {
      console.error("Lỗi khi thanh toán:", err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <h3>Thanh toán</h3>
        <div className="total-amount">{amount.toLocaleString()} đ</div>

        <div className="methods">
          {methods.map((m) => (
            <button key={m} onClick={() => handleConfirm(m)}>
              {m}
            </button>
          ))}
        </div>

        <button className="cancel-btn" onClick={onClose}>
          Hủy
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
