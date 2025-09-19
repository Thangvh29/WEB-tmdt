import Category from "../../models/category.model.js";

/**
 * Lấy tất cả categories cho user
 * GET /api/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).select("name slug");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Lỗi lấy categories:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy categories",
    });
  }
};
