const PaymentModal = ({ amount, onClose, selectedItems }) => {
  const methods = ["VNPay", "ZaloPay", "Ngân hàng"];

  const handleConfirm = (method) => {
    console.log("Thanh toán:", { method, amount, selectedItems });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-bold mb-4">Thanh toán</h3>
        <p className="mb-2">Tổng số tiền: <span className="font-semibold">{amount.toLocaleString()} đ</span></p>

        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => handleConfirm(m)}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              {m}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 text-gray-600 underline w-full">
          Hủy
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
