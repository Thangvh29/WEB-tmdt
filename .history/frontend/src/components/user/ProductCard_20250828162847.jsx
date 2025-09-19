// src/components/user/ProductCard.jsx
import { Link } from "react-router-dom";
import { toImageURL } from "../../utils/imageUrl";

const ProductCard = ({ p }) => {
  const img = toImageURL(p.image);

  const format = (n) =>
    n?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const hasRange = p.priceRange?.min !== p.priceRange?.max;
  const priceText = hasRange
    ? `${format(p.priceRange?.min)} - ${format(p.priceRange?.max)}`
    : format(p.priceRange?.min);

  return (
    <Link
      to={`/user/products/${p._id}`}
      className="block border rounded-xl p-3 hover:shadow-md relative"
    >
      {!p.inStock && (
        <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Hết hàng
        </span>
      )}

      <img
        src={img}
        alt={p.name}
        className="w-full h-44 object-cover rounded-md mb-3"
        loading="lazy"
      />

      <div className="text-sm text-gray-500 capitalize">
        {p.brand} • {p.type}
      </div>

      <div className="font-medium line-clamp-2 leading-snug">{p.name}</div>

      <div className="mt-2 text-red-600 font-semibold">{priceText}</div>

      <div className="text-xs text-gray-500 mt-1">
        Đã bán: {p.sold ?? 0}
      </div>
    </Link>
  );
};

export default ProductCard;
