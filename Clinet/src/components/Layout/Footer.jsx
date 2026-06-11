import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">India Trade Overseas</h3>
            <p className="text-gray-400">Your trusted partner in international trade since 2010.</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white"><FiFacebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FiTwitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FiLinkedin size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FiInstagram size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/products" className="hover:text-white">Products</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Natural Stones</a></li>
              <li><a href="#" className="hover:text-white">Coal</a></li>
              <li><a href="#" className="hover:text-white">Tea</a></li>
              <li><a href="#" className="hover:text-white">Rice</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-400">
              <li>123 Business Park, Mumbai, India</li>
              <li>+91 1234567890</li>
              <li>info@itoexim.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 India Trade Overseas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}