import React, { useState, useEffect } from 'react';
import { FiPlus, FiTruck, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { dispatchesApi } from '../../api/dispatches';

export default function Dispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    loadingPoint: '',
    destination: '',
    truckNo: '',
    driverName: '',
    driverPhone: '',
    material: '',
    quantity: '',
    loadingDate: ''
  });

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      const response = await dispatchesApi.getDispatches();
      if (response.success) {
        setDispatches(response.data.dispatches);
      }
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatchesApi.createDispatch(formData);
      if (response.success) {
        toast.success('Dispatch created successfully');
        setShowModal(false);
        setFormData({
          leadId: '',
          loadingPoint: '',
          destination: '',
          truckNo: '',
          driverName: '',
          driverPhone: '',
          material: '',
          quantity: '',
          loadingDate: ''
        });
        fetchDispatches();
      }
    } catch (error) {
      console.error('Error creating dispatch:', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await dispatchesApi.updateDispatchStatus(id, status);
      if (response.success) {
        toast.success(`Dispatch status updated to ${status}`);
        fetchDispatches();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PLANNED: 'bg-blue-100 text-blue-800',
      LOADED: 'bg-purple-100 text-purple-800',
      IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Dispatches</h1>
          <p className="text-gray-600 mt-1">Manage all dispatch operations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FiPlus size={18} />
          <span>New Dispatch</span>
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Truck No</th>
              <th className="text-left py-3 px-4">Driver</th>
              <th className="text-left py-3 px-4">Material</th>
              <th className="text-left py-3 px-4">Loading Point</th>
              <th className="text-left py-3 px-4">Destination</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No dispatches found</td>
              </tr>
            ) : (
              dispatches.map((dispatch) => (
                <tr key={dispatch._id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{dispatch.truckNo}</td>
                  <td className="py-3 px-4">{dispatch.driverName}</td>
                  <td className="py-3 px-4">{dispatch.material}</td>
                  <td className="py-3 px-4">{dispatch.loadingPoint}</td>
                  <td className="py-3 px-4">{dispatch.destination}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(dispatch.dispatchStatus)}`}>
                      {dispatch.dispatchStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button onClick={() => updateStatus(dispatch._id, 'LOADED')} className="text-purple-600 hover:text-purple-700" title="Mark Loaded">
                        <FiTruck size={18} />
                      </button>
                      <button onClick={() => updateStatus(dispatch._id, 'IN_TRANSIT')} className="text-yellow-600 hover:text-yellow-700" title="In Transit">
                        <FiClock size={18} />
                      </button>
                      <button onClick={() => updateStatus(dispatch._id, 'DELIVERED')} className="text-green-600 hover:text-green-700" title="Delivered">
                        <FiCheckCircle size={18} />
                      </button>
                      <button onClick={() => updateStatus(dispatch._id, 'CANCELLED')} className="text-red-600 hover:text-red-700" title="Cancel">
                        <FiXCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dispatch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Dispatch</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Lead ID *</label>
                  <input type="text" required value={formData.leadId} onChange={(e) => setFormData({ ...formData, leadId: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Loading Point *</label>
                  <input type="text" required value={formData.loadingPoint} onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Destination *</label>
                  <input type="text" required value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Truck Number *</label>
                  <input type="text" required value={formData.truckNo} onChange={(e) => setFormData({ ...formData, truckNo: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Driver Name *</label>
                  <input type="text" required value={formData.driverName} onChange={(e) => setFormData({ ...formData, driverName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Driver Phone</label>
                  <input type="tel" value={formData.driverPhone} onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Material *</label>
                  <input type="text" required value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input type="text" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Loading Date</label>
                  <input type="date" value={formData.loadingDate} onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })} className="input" />
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