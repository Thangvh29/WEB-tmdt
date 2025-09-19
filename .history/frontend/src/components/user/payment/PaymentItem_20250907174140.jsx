const PaymentItem = ({ item, selected, onSelect, onPayNow }) => {
  return (
    <div className="flex items-center justify-between border p-3 mb-2 rounded">
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={selected} onChange={onSelect} />
        <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
        <div>
          <div className="font-medium">{item.product.name}</div>
          <div className="text-sm text-gray-500">Số lượng: {item.quantity}</div>
          <div className="text-sm text-gray-500">
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <div>
        <div className="font-semibold">{(item.quantity * item.product.price).toLocaleString()} đ</div>
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
