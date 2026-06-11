import React, { useState, useEffect } from 'react';
import { FiPlus, FiTag, FiDollarSign, FiGlobe, FiFileText, FiImage, FiGrid, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { productsApi } from '../../api/products';
import { useAuth } from '../../hooks/useAuth';

export default function ProductUpload() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'stone',
    origin: '',
    price: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getProducts('all');
      if (response.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateImage = () => {
    const imagesByCategory = {
      stone: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600',
      coal: 'https://images.unsplash.com/photo-1581094288338-1a3eb6e1c5a4?w=600',
      tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb77374?w=600',
      rice: 'https://images.unsplash.com/photo-1586201375761-83865001b0e5?w=600'
    };

    const selectedImage = imagesByCategory[formData.category] || imagesByCategory.stone;
    setFormData(prev => ({
      ...prev,
      image: selectedImage
    }));
    toast.success('Assigned cover image matching category! 🖼️');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await productsApi.createProduct(formData);
      if (response.success) {
        toast.success('Product uploaded successfully!');
        setShowModal(false);
        setFormData({
          name: '',
          category: 'stone',
          origin: '',
          price: '',
          description: '',
          image: ''
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600">Add, edit, or configure import-export catalog items</p>
        </div>
        {(user?.role === 'ADMIN' || user?.productUploadPermission) && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg transition-transform active:scale-95"
          >
            <FiPlus size={20} />
            <span>Upload Product</span>
          </button>
        )}
      </div>

      {/* Products list grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <FiGrid size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No products uploaded yet. Click "Upload Product" to add the first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="card flex flex-col justify-between hover:shadow-md transition">
              <div>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-gray-500">
                <span>Origin: <strong>{product.origin}</strong></span>
                <span>FOB Price: <strong className="text-green-600">{product.price}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Add New Commodity to Catalog</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <div className="relative">
                  <FiTag className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-400"
                    placeholder="Enter Your Product Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm cursor-pointer"
                  >
                    <option value="stone">Natural Stones</option>
                    <option value="coal">Industrial Coal</option>
                    <option value="tea">Premium Tea</option>
                    <option value="rice">Rice Commodities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Origin Country *
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-400"
                      placeholder="Enter Origin Country"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    FOB Price Range *
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-400"
                      placeholder="Enter FOB Price Range"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Image URL *
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <FiImage className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        required
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-400"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={autoGenerateImage}
                      className="btn-secondary px-3 text-xs flex items-center justify-center shrink-0 border border-slate-200"
                      title="Auto-generate an image matching selected category"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Product Description *
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3.5 top-3.5 text-gray-400" />
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-400"
                    placeholder="Enter Product Description"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
