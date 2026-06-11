import React, { useState, useEffect } from 'react';
import { FiPlus, FiDollarSign, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { paymentsApi } from '../../api/payments';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    totalAmount: '',
    advanceAmount: '0',
    dueDate: ''
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await paymentsApi.getPayments();
      if (response.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await paymentsApi.createPayment(formData);
      if (response.success) {
        toast.success('Payment record created successfully');
        setShowModal(false);
        setFormData({ leadId: '', totalAmount: '', advanceAmount: '0', dueDate: '' });
        fetchPayments();
      }
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await paymentsApi.updatePaymentStatus(id, status);
      if (response.success) {
        toast.success(`Payment status updated to ${status}`);
        fetchPayments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage all payment transactions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FiPlus size={18} />
          <span>Add Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{payments.reduce((sum, p) => sum + (p.advanceAmount || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiDollarSign className="text-green-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{payments.reduce((sum, p) => sum + (p.balanceAmount || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiAlertCircle className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.filter(p => p.paymentStatus === 'PAID').length}
              </p>
            </div>
            <FiCheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Lead ID</th>
              <th className="text-left py-3 px-4">Total Amount</th>
              <th className="text-left py-3 px-4">Advance</th>
              <th className="text-left py-3 px-4">Balance</th>
              <th className="text-left py-3 px-4">Due Date</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No payments found</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{payment.leadId?.leadCode || payment.leadId}</td>
                  <td className="py-3 px-4">₹{payment.totalAmount?.toLocaleString()}</td>
                  <td className="py-3 px-4">₹{payment.advanceAmount?.toLocaleString()}</td>
                  <td className="py-3 px-4">₹{payment.balanceAmount?.toLocaleString()}</td>
                  <td className="py-3 px-4">{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select onChange={(e) => updateStatus(payment._id, e.target.value)} className="text-sm border rounded px-2 py-1">
                      <option value="">Update Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Payment Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Lead ID *</label>
                  <input type="text" required value={formData.leadId} onChange={(e) => setFormData({ ...formData, leadId: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Total Amount (₹) *</label>
                  <input type="number" required value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Advance Amount (₹)</label>
                  <input type="number" value={formData.advanceAmount} onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}