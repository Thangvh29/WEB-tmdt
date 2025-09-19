// src/controllers/user/categories.controller.ts
import type { Request, Response } from "express";
import Category from "../../models"; // chỉnh lại path model theo dự án của bạn

// GET /api/categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find(); // lấy tất cả category
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy categories",
      error: error.message,
    });
  }
};

// GET /api/categories/:id
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết category",
      error: error.message,
    });
  }
};
