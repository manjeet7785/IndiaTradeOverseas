import React, { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiEye, FiLock, FiUnlock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { documentsApi } from '../../api/documents';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    ownerType: 'LEAD',
    ownerId: '',
    accessLevel: 'RESTRICTED'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentsApi.getDocuments();
      if (response.success) {
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('ownerType', formData.ownerType);
    data.append('ownerId', formData.ownerId);
    data.append('accessLevel', formData.accessLevel);

    try {
      const response = await documentsApi.uploadDocument(data);
      if (response.success) {
        toast.success('Document uploaded successfully');
        setShowModal(false);
        setSelectedFile(null);
        setFormData({ ownerType: 'LEAD', ownerId: '', accessLevel: 'RESTRICTED' });
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const downloadDocument = async (id, fileName) => {
    try {
      const blob = await documentsApi.downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const updateAccessLevel = async (id, accessLevel) => {
    try {
      const response = await documentsApi.updateAccessLevel(id, accessLevel);
      if (response.success) {
        toast.success(`Access level updated to ${accessLevel}`);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error updating access level:', error);
    }
  };

  const deleteDocument = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await documentsApi.deleteDocument(id);
        if (response.success) {
          toast.success('Document deleted successfully');
          fetchDocuments();
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const getAccessLevelIcon = (level) => {
    return level === 'RESTRICTED' || level === 'ADMIN' ? <FiLock className="text-red-500" /> : <FiUnlock className="text-green-500" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage all your documents</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FiUpload size={18} />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">File Name</th>
              <th className="text-left py-3 px-4">Owner Type</th>
              <th className="text-left py-3 px-4">Owner ID</th>
              <th className="text-left py-3 px-4">Access Level</th>
              <th className="text-left py-3 px-4">Uploaded</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">No documents found</td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc._id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{doc.fileName}</td>
                  <td className="py-3 px-4">{doc.ownerType}</td>
                  <td className="py-3 px-4">{doc.ownerId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getAccessLevelIcon(doc.accessLevel)}
                      <select
                        value={doc.accessLevel}
                        onChange={(e) => updateAccessLevel(doc._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="PUBLIC">Public</option>
                        <option value="INTERNAL">Internal</option>
                        <option value="RESTRICTED">Restricted</option>
                        <option value="ADMIN">Admin Only</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-3">
                      <button onClick={() => downloadDocument(doc._id, doc.fileName)} className="text-blue-600 hover:text-blue-700">
                        <FiDownload size={18} />
                      </button>
                      <button onClick={() => deleteDocument(doc._id)} className="text-red-600 hover:text-red-700">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleUpload}>
              <div className="space-y-4">
                <div>
                  <label className="label">Select File *</label>
                  <input type="file" onChange={handleFileChange} required className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="label">Owner Type *</label>
                  <select value={formData.ownerType} onChange={(e) => setFormData({ ...formData, ownerType: e.target.value })} className="input">
                    <option value="LEAD">Lead</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="PAYMENT">Payment</option>
                  </select>
                </div>
                <div>
                  <label className="label">Owner ID *</label>
                  <input type="text" required value={formData.ownerId} onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })} className="input" placeholder="Enter lead ID or document owner ID" />
                </div>
                <div>
                  <label className="label">Access Level</label>
                  <select value={formData.accessLevel} onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })} className="input">
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="ADMIN">Admin Only</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Upload</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}