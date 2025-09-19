import type { Request, Response } from "express";
import Category from "../../models/category.model.js";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ active: true })
      .select("name slug description parent image")
      .sort({ name: 1 })
      .lean();
    res.json(categories);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Không thể lấy danh mục" });
  }
};

export const getCategoryTree = async (req: Request, res: Response) => {
  try {
    if (typeof (Category as any).getTree !== "function") {
      return res.status(500).json({ message: "Model Category chưa có hàm getTree" });
    }
    const tree = await (Category as any).getTree();
    res.json(tree);
  } catch (err) {
    console.error("getCategoryTree error:", err);
    res.status(500).json({ message: "Không thể lấy tree danh mục" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, parent, image } = req.body;
    const category = new Category({ name, description, parent, image, active: true });
    await category.save();
    res.status(201).json(category);
  } catch (err: any) {
    console.error("createCategory error:", err);
    res.status(400).json({ message: err.message || "Không thể tạo danh mục" });
  }
};
