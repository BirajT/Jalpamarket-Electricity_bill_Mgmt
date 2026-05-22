import Category from "../models/category.model.js";

/** Category id plus parent or children ids for brand/product filters */
export const getCategoryFilterIds = async (categoryId) => {
  if (!categoryId) return [];

  const cat = await Category.findById(categoryId);
  if (!cat) return [categoryId];

  const ids = new Set([categoryId.toString()]);

  if (cat.parent) {
    ids.add(cat.parent.toString());
  } else {
    const subs = await Category.find({ parent: categoryId }).select("_id");
    subs.forEach((s) => ids.add(s._id.toString()));
  }

  return Array.from(ids);
};
