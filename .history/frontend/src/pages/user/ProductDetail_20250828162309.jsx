// src/pages/user/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchProductDetail,
  checkVariant,
  fetchReviews,
  fetchRelated,
} from "../../services/products";
import { toImageURL } from "../../utils/imageUrl";

const currency = (n) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const ProductDetail = () => {
  const { id } = useParams();
  const [prod, setProd] = useState(null);
  const [reviews, setReviews] = useState({ reviews: [], total: 0, page: 1 });
  const [related, setRelated] = useState([]);
  const [attrs, setAttrs] = useState([]); // {name,value}[]
  const [variant, setVariant] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await fetchProductDetail(id);
        if (!mounted) return;
        setProd(data.product);
        // build attribute options từ variants
        const attrNames = new Set();
        (data.product.variants || []).forEach((v) =>
          (v.attributes || []).forEach((a) => attrNames.add(a.name))
        );
        // init attrs bằng default variant nếu có
        const def = (data.product.variants || []).find((v) => v.isDefault);
        if (def) setAttrs(def.attributes || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    fetchRelated(id).then(({ data }) => setRelated(data.related || []));
    fetchReviews(id, { page: 1, limit: 6 }).then(({ data }) =>
      setReviews({ reviews: data.reviews || [], total: data.total || 0, page: data.page || 1 })
    );
  }, [id]);

  const priceDisplay = useMemo(() => {
    if (!prod) return 0;
    if (variant?.price) return variant.price;
    const r = prod.priceRange || { min: prod.price, max: prod.price };
    return r.min;
  }, [prod, variant]);

  const canBuy = useMemo(() => {
    if (!prod) return false;
    if (!prod.canBuy) return false;
    if (variant) return (variant.stock ?? 0) > 0;
    return true;
  }, [prod, variant]);

  const onChangeAttr = (name, value) => {
    const next = [...attrs.filter((a) => a.name !== name), { name, value }];
    setAttrs(next);
  };

  const onCheckVariant = async () => {
    if (!attrs.length) return;
    setChecking(true);
    try {
      const { data } = await checkVariant(id, attrs);
      setVariant(data.found ? data.variant : null);
    } finally {
      setChecking(false);
    }
  };

  const addToCart = () => {
    // TODO: gọi API giỏ hàng /api/user/cart
    alert("Đã thêm vào giỏ (demo).");
  };

  if (!prod) return <div className="p-4">Đang tải chi tiết…</div>;

  return (
    <div className="p-4 grid gap-6 md:grid-cols-2">
      {/* Ảnh */}
      <div>
        <img
          src={toImageURL((prod.images || [])[0])}
          alt={prod.name}
          className="w-full rounded-lg object-cover"
        />
        <div className="flex gap-2 mt-2">
          {(prod.images || []).slice(0, 5).map((img, i) => (
            <img
              key={i}
              src={toImageURL(img)}
              alt=""
              className="w-16 h-16 object-cover rounded border"
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div>
        <h1 className="text-2xl font-semibold">{prod.name}</h1>
        <div className="text-sm text-gray-500 capitalize mt-1">
          {prod.brand} • {prod.type} • {prod.category?.name}
        </div>

        <div className="mt-3">
          <div className="text-red-600 text-2xl font-bold">{currency(priceDisplay)}</div>
          <div className="text-sm text-gray-600">
            {prod.ratingCount} đánh giá • ⭐ {Math.round((prod.avgRating || 0) * 10) / 10}
          </div>
        </div>

        {/* Thuộc tính (nếu có) */}
        {(prod.variants || []).length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Tập các tên thuộc tính */}
            {Array.from(
              new Set(
                (prod.variants || []).flatMap((v) => (v.attributes || []).map((a) => a.name))
              )
            ).map((name) => {
              const values = Array.from(
                new Set(
                  (prod.variants || [])
                    .flatMap((v) => v.attributes || [])
                    .filter((a) => a.name === name)
                    .map((a) => a.value)
                )
              );
              const selected = attrs.find((a) => a.name === name)?.value || "";
              return (
                <div key={name}>
                  <div className="text-sm font-medium mb-1">{name}</div>
                  <div className="flex flex-wrap gap-2">
                    {values.map((val) => (
                      <button
                        key={val}
                        onClick={() => onChangeAttr(name, val)}
                        className={`px-3 py-1 border rounded ${selected === val ? "bg-black text-white" : ""}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={onCheckVariant}
              disabled={checking || attrs.length === 0}
              className="px-4 py-2 border rounded"
            >
              {checking ? "Đang kiểm tra..." : "Xem giá biến thể"}
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex gap-3">
          <button
            disabled={!canBuy}
            onClick={addToCart}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Thêm vào giỏ
          </button>
          <button
            disabled={!canBuy}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Mua ngay / Trả góp
          </button>
          {!canBuy && <span className="text-red-600 self-center">Hết hàng</span>}
        </div>

        {/* Specs */}
        {prod.specs?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Cấu hình</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {prod.specs.map((s, i) => (
                <li key={i} className="border rounded p-2">
                  <span className="text-gray-500">{s.key}:</span> {s.value}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Commitments */}
        {prod.commitments?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Cam kết</h3>
            <ul className="list-disc pl-5 text-sm">
              {prod.commitments.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="md:col-span-2 mt-8">
        <h3 className="text-lg font-semibold mb-3">Đánh giá ({reviews.total})</h3>
        <div className="space-y-3">
          {reviews.reviews.map((r) => (
            <div key={r._id} className="border rounded p-3">
              <div className="text-sm text-gray-600">
                <img
                  src={toImageURL(r.author?.avatar)}
                  alt=""
                  className="inline-block w-6 h-6 rounded-full mr-2 object-cover"
                />
                <b>{r.author?.name || "Người dùng"}</b> • ⭐ {r.rating}
              </div>
              <div className="mt-1">{r.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      <div className="md:col-span-2 mt-8">
        <h3 className="text-lg font-semibold mb-3">Sản phẩm liên quan</h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {related.map((r) => (
            <a
              key={r._id}
              href={`/user/products/${r._id}`}
              className="border rounded p-2 hover:shadow"
            >
              <img
                src={toImageURL(r.image)}
                alt={r.name}
                className="w-full h-28 object-cover rounded mb-2"
              />
              <div className="text-sm line-clamp-2">{r.name}</div>
              <div className="text-xs text-gray-500 mt-1">{r.inStock ? "Còn hàng" : "Hết hàng"}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
