// src/pages/user/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../../services/products";
import ProductCard from "../../components/user/ProductCard";
import ProductFilters from "../../components/user/ProductFilters";

const Products = () => {
  const [params, setParams] = useState({ page: 1, limit: 12, sort: "newest" });
  const [data, setData] = useState({ products: [], total: 0, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);

  const queryParams = useMemo(() => {
    const { page, limit, ...rest } = params;
    return { ...rest, page, limit };
  }, [params]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchProducts(queryParams)
      .then(({ data }) => mounted && setData(data))
      .catch(() => mounted && setData({ products: [], total: 0, page: 1, limit: params.limit }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [queryParams]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || params.limit)));

  return (
    <div className="p-4">
      <ProductFilters
        initial={params}
        onChange={(f) => setParams((prev) => ({ ...prev, ...f, page: 1 }))}
      />

      {loading ? (
        <div className="py-12 text-center">Đang tải sản phẩm…</div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.products?.map((p) => <ProductCard key={p._id} p={p} />)}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={params.page <= 1}
              onClick={() => setParams((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm">Trang {data.page} / {totalPages}</span>
            <button
              disabled={params.page >= totalPages}
              onClick={() => setParams((s) => ({ ...s, page: Math.min(totalPages, s.page + 1) }))}
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
