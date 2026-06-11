import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsApi } from '../../api/leads';
import { quotationsApi } from '../../api/quotations';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { FiArrowLeft, FiActivity, FiFileText, FiTruck, FiDollarSign, FiSend, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ note: '', actionType: 'FOLLOW_UP', nextFollowupAt: '' });
  const [quotationData, setQuotationData] = useState({ employeeRequestedPrice: '', paymentTerms: '', validityDays: 7 });

  const [users, setUsers] = useState([]);
  const [assignee, setAssignee] = useState('');
  const [deptAssignee, setDeptAssignee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const stages = ['NEW_LEAD', 'ASSIGNED', 'CONTACTED', 'QUOTATION_REQUIRED', 'QUOTATION_REQUESTED', 'QUOTATION_SHARED', 'DISPATCH_PLANNED', 'PAYMENT_PENDING', 'CLOSED_WON', 'CLOSED_LOST'];
  const departments = ['STONE', 'COAL', 'TEA', 'RICE', 'TRANSPORT', 'ADMIN', 'IT', 'PROCUREMENT', 'ACCOUNTS', 'HR', 'SALES'];

  useEffect(() => {
    fetchLeadDetails();
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      fetchUsers();
    }
  }, [id, user]);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLeadDetails = async () => {
    try {
      const response = await leadsApi.getLeadById(id);
      if (response.success) {
        setLead(response.data.lead);
        setActivities(response.data.activities);
        setAssignee(response.data.lead.assignedTo?._id || response.data.lead.assignedTo || '');
        setDeptAssignee(response.data.lead.assignedDepartment || '');
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (window.confirm('Are you sure you want to permanently delete this task/lead? This will delete all activity logs for it.')) {
      try {
        const response = await leadsApi.deleteLead(id);
        if (response.success) {
          toast.success('Lead deleted successfully');
          navigate('/crm/leads');
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      const response = await adminApi.assignLead(id, {
        assignedTo: assignee || null,
        assignedDepartment: deptAssignee || null
      });
      if (response.success) {
        toast.success('Lead assignment updated successfully');
        fetchLeadDetails();
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStageChange = async (newStage) => {
    try {
      const response = await leadsApi.updateStage(id, { newStage });
      if (response.success) {
        toast.success(`Stage updated to ${newStage.replace(/_/g, ' ')}`);
        fetchLeadDetails();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const response = await leadsApi.addActivity(id, newActivity);
      if (response.success) {
        toast.success('Activity added successfully');
        setShowActivityModal(false);
        setNewActivity({ note: '', actionType: 'FOLLOW_UP', nextFollowupAt: '' });
        fetchLeadDetails();
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleRequestQuotation = async (e) => {
    e.preventDefault();
    try {
      const response = await quotationsApi.requestQuotation({ leadId: id, ...quotationData });
      if (response.success) {
        toast.success('Quotation requested successfully');
        setShowQuotationModal(false);
        setQuotationData({ employeeRequestedPrice: '', paymentTerms: '', validityDays: 7 });
        fetchLeadDetails();
      }
    } catch (error) {
      console.error('Error requesting quotation:', error);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      NEW_LEAD: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      CONTACTED: 'bg-purple-100 text-purple-800',
      QUOTATION_REQUIRED: 'bg-yellow-100 text-yellow-800',
      QUOTATION_REQUESTED: 'bg-orange-100 text-orange-800',
      QUOTATION_SHARED: 'bg-green-100 text-green-800',
      DISPATCH_PLANNED: 'bg-teal-100 text-teal-800',
      PAYMENT_PENDING: 'bg-red-100 text-red-800',
      CLOSED_WON: 'bg-emerald-100 text-emerald-800',
      CLOSED_LOST: 'bg-gray-100 text-gray-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  const selectedUser = users.find((u) => u._id === assignee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/crm/leads')} className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.customerName}</h1>
            <p className="text-gray-600">{lead.leadCode}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowQuotationModal(true)} className="btn-primary flex items-center space-x-2">
            <FiFileText size={18} />
            <span>Request Quotation</span>
          </button>
          <button onClick={() => setShowActivityModal(true)} className="btn-secondary flex items-center space-x-2">
            <FiActivity size={18} />
            <span>Add Activity</span>
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center space-x-2"
            >
              <FiTrash2 size={18} />
              <span>Delete Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Lead Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Phone</p>
          <p className="text-lg font-semibold mt-1 text-ellipsis overflow-hidden">{lead.phoneMasked || 'N/A'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Email</p>
          <p className="text-lg font-semibold mt-1 text-ellipsis overflow-hidden">{lead.emailMasked || 'N/A'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Product</p>
          <p className="text-lg font-semibold mt-1">{lead.productCategory}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Quantity</p>
          <p className="text-lg font-semibold mt-1">{lead.quantity || 'N/A'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Assigned To</p>
          <p className="text-lg font-semibold mt-1 text-ellipsis overflow-hidden text-blue-600">
            {lead.assignedTo?.fullName || lead.assignedTo || 'Unassigned'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Department</p>
          <p className="text-lg font-semibold mt-1 text-ellipsis overflow-hidden text-indigo-600">
            {lead.assignedDepartment || 'None'}
          </p>
        </div>
      </div>

      {/* Assignment Management (Admin/Manager Only) */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Task / Lead</h2>
          <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="label">Assign to Employee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="input"
              >
                <option value="">Select Employee (Unassigned)</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} ({u.role} - {u.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="label">Assign to Department</label>
              <select
                value={deptAssignee}
                onChange={(e) => setDeptAssignee(e.target.value)}
                className="input"
              >
                <option value="">Select Department (None)</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isAssigning}
              className="btn-primary w-full md:w-auto px-6 whitespace-nowrap"
            >
              {isAssigning ? 'Saving...' : 'Update Assignment'}
            </button>
          </form>

          {/* Dynamic visual preview of assignment */}
          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignment Preview</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Employee:</span>
                {selectedUser ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    👤 {selectedUser.fullName} ({selectedUser.role})
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    Unassigned
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Department:</span>
                {deptAssignee ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    🏢 {deptAssignee}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    None
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedUser
                ? `This task will be assigned to ${selectedUser.fullName} (${selectedUser.role}).`
                : 'No specific employee will be assigned to this task.'}
              {deptAssignee
                ? ` It will be routed to the ${deptAssignee} department.`
                : ' It will not belong to any department.'}
            </p>
          </div>
        </div>
      )}

      {/* Stage Management */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Management</h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${lead.stage === stage
                ? getStageColor(stage) + ' ring-2 ring-offset-2 ring-primary-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {stage.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No activities recorded yet</p>
          ) : (
            activities.map((activity) => (
              <div key={activity._id} className="border-l-4 border-primary-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900">{activity.actionType}</span>
                  <span className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-600">{activity.note}</p>
                {activity.nextFollowupAt && (
                  <p className="text-sm text-primary-600 mt-1">Next Follow-up: {new Date(activity.nextFollowupAt).toLocaleDateString()}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Activity</h2>
            <form onSubmit={handleAddActivity}>
              <div className="space-y-4">
                <div>
                  <label className="label">Activity Type</label>
                  <select
                    value={newActivity.actionType}
                    onChange={(e) => setNewActivity({ ...newActivity, actionType: e.target.value })}
                    className="input"
                  >
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="NOTE">Note</option>
                  </select>
                </div>
                <div>
                  <label className="label">Note</label>
                  <textarea
                    required
                    rows={3}
                    value={newActivity.note}
                    onChange={(e) => setNewActivity({ ...newActivity, note: e.target.value })}
                    className="input"
                    placeholder="Enter activity details..."
                  ></textarea>
                </div>
                <div>
                  <label className="label">Next Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={newActivity.nextFollowupAt}
                    onChange={(e) => setNewActivity({ ...newActivity, nextFollowupAt: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Add</button>
                <button type="button" onClick={() => setShowActivityModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Quotation Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request Quotation</h2>
            <form onSubmit={handleRequestQuotation}>
              <div className="space-y-4">
                <div>
                  <label className="label">Requested Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={quotationData.employeeRequestedPrice}
                    onChange={(e) => setQuotationData({ ...quotationData, employeeRequestedPrice: e.target.value })}
                    className="input"
                    placeholder="Enter requested price"
                  />
                </div>
                <div>
                  <label className="label">Payment Terms</label>
                  <input
                    type="text"
                    value={quotationData.paymentTerms}
                    onChange={(e) => setQuotationData({ ...quotationData, paymentTerms: e.target.value })}
                    className="input"
                    placeholder="e.g., 30% advance, 70% against documents"
                  />
                </div>
                <div>
                  <label className="label">Validity (Days)</label>
                  <input
                    type="number"
                    value={quotationData.validityDays}
                    onChange={(e) => setQuotationData({ ...quotationData, validityDays: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Submit</button>
                <button type="button" onClick={() => setShowQuotationModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}