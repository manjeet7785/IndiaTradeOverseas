import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { productsApi } from '../../api/products';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const response = await productsApi.getProducts('all');
        if (response.success) {
          setDbProducts(response.data.products);
        }
      } catch (error) {
        console.error('Error fetching database products:', error);
      }
    };
    fetchDbProducts();
  }, []);

  const staticProducts = [
    { id: 1, name: 'Indian Granite', category: 'stone', origin: 'India', price: '$50-200/ton', image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400', description: 'Premium quality granite for construction' },
    { id: 2, name: 'Italian Marble', category: 'stone', origin: 'Italy', price: '$100-500/ton', image: 'https://images.unsplash.com/photo-1569691105751-88df003de7a4?w=400', description: 'Luxury marble for flooring and decor' },
    { id: 3, name: 'Indonesian Coal', category: 'coal', origin: 'Indonesia', price: '$80-120/ton', image: 'https://images.unsplash.com/photo-1581094288338-1a3eb6e1c5a4?w=400', description: 'High-calorie thermal coal' },
    { id: 4, name: 'Australian Coal', category: 'coal', origin: 'Australia', price: '$90-140/ton', image: 'https://images.unsplash.com/photo-1581094288338-1a3eb6e1c5a4?w=400', description: 'Premium metallurgical coal' },
    { id: 5, name: 'Darjeeling Tea', category: 'tea', origin: 'India', price: '$20-50/kg', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb77374?w=400', description: 'Premium first-flush tea' },
    { id: 6, name: 'Assam Tea', category: 'tea', origin: 'India', price: '$15-30/kg', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', description: 'Strong and malty black tea' },
    { id: 7, name: 'Basmati Rice', category: 'rice', origin: 'India', price: '$800-1200/ton', image: 'https://images.unsplash.com/photo-1586201375761-83865001b0e5?w=400', description: 'Premium long-grain aromatic rice' },
    { id: 8, name: 'Jasmine Rice', category: 'rice', origin: 'Thailand', price: '$700-1000/ton', image: 'https://images.unsplash.com/photo-1586201375761-83865001b0e5?w=400', description: 'Fragrant Thai rice variety' }
  ];

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'stone', label: 'Natural Stones' },
    { value: 'coal', label: 'Coal' },
    { value: 'tea', label: 'Tea' },
    { value: 'rice', label: 'Rice' }
  ];

  const products = [...dbProducts, ...staticProducts];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.origin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
        <p className="text-gray-600 mt-4">Discover our wide range of premium quality products</p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="w-64">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div key={product._id || product.id} className="card hover:shadow-lg transition">
            <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg mb-4" />
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>Origin: {product.origin}</span>
              <span>Price: {product.price}</span>
            </div>
            <Link to="/quote-request" className="btn-primary w-full text-center block">
              Request Quote
            </Link>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}