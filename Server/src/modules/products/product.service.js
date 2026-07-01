const Product = require('./product.model');

async function listProducts(filters = {}) {
  return Product.find(filters).sort({ createdAt: -1 });
}

async function createProduct(data) {
  return Product.create(data);
}

async function getProductById(id) {
  return Product.findById(id);
}

async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

async function updateProduct(id, data) {
  return Product.findByIdAndUpdate(id, data, { new: true });
}

module.exports = {
  listProducts,
  createProduct,
  getProductById,
  deleteProduct,
  updateProduct
};
