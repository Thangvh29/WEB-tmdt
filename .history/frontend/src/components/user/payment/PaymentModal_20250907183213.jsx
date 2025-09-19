import api from "../../../services/axios";
import "../../../assets/style/payment-modal.css";
import momo from "../../../assets/img/momo.jpg";
import paypal from "../../../assets/img/paypal.png";
import vnpay from "../../../assets/img/vnpay.jpg";
import zalopay from "../../../assets/img/zalopay.png";

const PaymentModal = ({ amount, onClose, selectedItems }) => {
  const methods = [
    { name: "VNPay", img: vnpay },
    { name: "ZaloPay", img: zalopay },
    { name: "Momo", img: momo },
    { name: "PayPal", img: paypal },
  ];

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
        <div className="total-amount">
          {amount.toLocaleString()} đ
        </div>

        <div className="methods">
          {methods.map((m) => (
            <button key={m.name} onClick={() => handleConfirm(m.name)}>
              <img src={m.img} alt={m.name} />
              {m.name}
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
