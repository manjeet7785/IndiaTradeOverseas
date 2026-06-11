const Product = require('../models/Product');
const { ok, fail } = require('../utils/response');

async function createProduct(req, res) {
  try {
    if (req.user.role !== 'ADMIN' && !req.user.productUploadPermission) {
      return fail(res, 403, 'OWNERSHIP_FORBIDDEN', 'You do not have permission to upload products');
    }

    const { name, category, origin, price, description, image } = req.body;

    if (!name || !category || !origin || !price || !description || !image) {
      return fail(res, 400, 'VALIDATION_FAILED', 'All fields (name, category, origin, price, description, image) are required');
    }

    if (!['stone', 'coal', 'tea', 'rice'].includes(category)) {
      return fail(res, 400, 'VALIDATION_FAILED', 'Invalid product category');
    }

    const product = await Product.create({
      name,
      category,
      origin,
      price,
      description,
      image
    });

    return ok(res, { product }, 201);
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

async function listProducts(req, res) {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && ['stone', 'coal', 'tea', 'rice'].includes(category)) {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return ok(res, { products });
  } catch (error) {
    return fail(res, 500, 'SERVER_ERROR', error.message);
  }
}

module.exports = {
  createProduct,
  listProducts
};
