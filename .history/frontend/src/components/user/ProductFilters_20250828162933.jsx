// src/components/user/ProductFilters.jsx
import { useEffect, useState } from "react";
\

const ProductFilters = ({ onChange, initial = {} }) => {
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [range, setRange] = useState({ min: 0, max: 0 });

  const [form, setForm] = useState({
    q: initial.q || "",
    isNew: initial.isNew ?? "",
    brand: initial.brand || "",
    type: initial.type || "",
    category: initial.category || "",
    minPrice: initial.minPrice || "",
    maxPrice: initial.maxPrice || "",
    sort: initial.sort || "newest",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await fetchFilters();
        setBrands(data.brands || []);
        setTypes(data.types || []);
        setCategories(data.categories || []);
        setRange(data.priceRange || { min: 0, max: 0 });
      } catch (err) {
        console.error("Lỗi tải filters:", err);
      }
    })();
  }, []);

  const update = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onChange?.(next);
  };

  return (
    <div className="grid gap-3 md:grid-cols-6 sm:grid-cols-3 grid-cols-2 mb-4">
      {/* Search */}
      <input
        placeholder="Tìm kiếm sản phẩm..."
        className="border rounded px-3 py-2 md:col-span-2"
        value={form.q}
        onChange={(e) => update("q", e.target.value)}
      />

      {/* New / Old */}
      <select
        value={form.isNew}
        onChange={(e) => update("isNew", e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Mới / Cũ</option>
        <option value="true">Hàng mới</option>
        <option value="false">Hàng cũ</option>
      </select>

      {/* Type */}
      <select
        value={form.type}
        onChange={(e) => update("type", e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Loại</option>
        {types.map((t) => (
          <option key={t.type} value={t.type}>
            {t.type} ({t.count})
          </option>
        ))}
      </select>

      {/* Brand */}
      <select
        value={form.brand}
        onChange={(e) => update("brand", e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Hãng</option>
        {brands.map((b) => (
          <option key={b.brand} value={b.brand}>
            {b.brand} ({b.count})
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        value={form.category}
        onChange={(e) => update("category", e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Danh mục</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Price range */}
      <input
        type="number"
        placeholder={`Giá từ (${range.min?.toLocaleString()})`}
        className="border rounded px-3 py-2"
        value={form.minPrice}
        onChange={(e) => update("minPrice", e.target.value)}
      />
      <input
        type="number"
        placeholder={`Giá đến (${range.max?.toLocaleString()})`}
        className="border rounded px-3 py-2"
        value={form.maxPrice}
        onChange={(e) => update("maxPrice", e.target.value)}
      />

      {/* Sort */}
      <select
        value={form.sort}
        onChange={(e) => update("sort", e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="newest">Mới nhất</option>
        <option value="popular">Bán chạy</option>
        <option value="priceAsc">Giá tăng dần</option>
        <option value="priceDesc">Giá giảm dần</option>
      </select>
    </div>
  );
};

export default ProductFilters;
