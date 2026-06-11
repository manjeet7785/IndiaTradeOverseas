import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'SALES',
    department: 'SALES'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminApi.createUser(formData);
      if (response.success) {
        toast.success('Employee created successfully');
        setShowModal(false);
        setFormData({
          employeeId: '',
          fullName: '',
          email: '',
          phone: '',
          password: '',
          role: 'SALES',
          department: 'SALES'
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    if (!currentStatus) {
      try {
        const response = await adminApi.activateUser(id);
        if (response.success) {
          toast.success('User activated successfully');
          fetchUsers();
        }
      } catch (error) {
        console.error('Error activating user:', error);
      }
    } else {
      try {
        const response = await adminApi.deactivateUser(id);
        if (response.success) {
          toast.success('User deactivated successfully');
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deactivating user:', error);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this employee? This will unassign all their leads/tasks.')) {
      try {
        const response = await adminApi.deleteUser(userId);
        if (response.success) {
          toast.success('User deleted successfully');
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FiUserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">Employee ID</th>
              <th className="text-left py-3 px-4">Full Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Department</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{user.employeeId}</td>
                  <td className="py-3 px-4">{user.fullName}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{user.role}</span>
                  </td>
                  <td className="py-3 px-4">{user.department}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center space-x-3">
                    <button onClick={() => toggleUserStatus(user._id, user.isActive)} className={`${user.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`} title={user.isActive ? "Deactivate" : "Activate"}>
                      {user.isActive ? <FiXCircle size={18} /> : <FiCheckCircle size={18} />}
                    </button>
                    <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-700" title="Delete Employee">
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Employee ID *</label>
                  <input type="text" required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input">
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SALES">Sales</option>
                    <option value="PROCUREMENT">Procurement</option>
                    <option value="ACCOUNTS">Accounts</option>
                  </select>
                </div>
                <div>
                  <label className="label">Department *</label>
                  <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input">
                    <option value="STONE">Stone</option>
                    <option value="COAL">Coal</option>
                    <option value="TEA">Tea</option>
                    <option value="RICE">Rice</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="ADMIN">Admin</option>
                  </select>
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