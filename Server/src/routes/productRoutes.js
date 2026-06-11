const router = require('express').Router();
const auth = require('../middleware/auth');
const { createProduct, listProducts } = require('../controllers/productController');

// Public route to list products
router.get('/', listProducts);

// Protected route to upload a new product
router.post('/', auth, createProduct);

module.exports = router;
