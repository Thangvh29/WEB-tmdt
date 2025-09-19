const PaymentItem = ({ order, selected, onSelect, onPayNow }) => {
  const firstItem = order.firstItem || {};

  return (
    <div className="flex items-center justify-between border p-3 mb-2 rounded">
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={selected} onChange={onSelect} />
        <img
          src={firstItem.image || "/default-product.png"}
          alt={firstItem.name || "Sản phẩm"}
          className="w-12 h-12 object-cover rounded"
        />
        <div>
          <div className="font-medium">{firstItem.name || "Sản phẩm"}</div>
          <div className="text-sm text-gray-500">Số lượng: {firstItem.qty || 0}</div>
          <div className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <div>
        <div className="font-semibold">{order.totalAmount?.toLocaleString() || 0} đ</div>
        <button
          onClick={onPayNow}
          className="text-sm text-blue-600 underline"
        >
          Thanh toán
        </button>
      </div>
    </div>
  );
};

export default PaymentItem;
