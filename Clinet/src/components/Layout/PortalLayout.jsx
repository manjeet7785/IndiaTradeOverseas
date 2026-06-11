import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PortalLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:hidden bg-white shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition"
          >
            <FiMenu size={22} />
          </button>
          <div className="text-base font-semibold text-slate-900">ITO Exim Portal</div>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex min-h-screen">
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-gray-900 text-white transition duration-300 ease-in-out md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="md:hidden border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Portal Menu</h2>
              <p className="text-sm text-gray-400">Admin / Employee Access</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <FiX size={20} />
            </button>
          </div>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col md:pl-72">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
