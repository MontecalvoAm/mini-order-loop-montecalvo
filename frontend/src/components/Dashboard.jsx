import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  
  // Bulk Selection State
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkResult, setBulkResult] = useState('');

  const fetchOrders = () => {
    api.get('/orders', { params: { search, status } })
      .then(res => {
        setOrders(res.data.data);
        // Clear selection if list changes
        setSelectedOrders([]);
      })
      .catch(console.error);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, status]);

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(oId => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Determine which bulk actions are valid based on selected orders
  const getValidBulkActions = () => {
    if (selectedOrders.length === 0) return [];
    
    const selected = orders.filter(o => selectedOrders.includes(o.id));
    const allStatuses = [...new Set(selected.map(o => o.status))];
    
    // To perform a bulk action, all selected orders must be in the exact same state
    if (allStatuses.length > 1) return [];
    
    const currentStatus = allStatuses[0];
    const actions = [];

    if (user?.role === 'requester') {
      if (currentStatus === 'draft') actions.push({ label: 'Submit', action: 'submit', color: 'blue' });
      if (['draft', 'submitted'].includes(currentStatus)) actions.push({ label: 'Cancel', action: 'cancel', color: 'gray' });
    }
    
    if (user?.role === 'approver') {
      if (currentStatus === 'submitted') {
        actions.push({ label: 'Approve', action: 'approve', color: 'emerald' });
        // Rejecting bulk without reason might be tricky, so let's only allow approve/fulfill/close for bulk
      }
      if (currentStatus === 'approved') actions.push({ label: 'Fulfill', action: 'fulfill', color: 'indigo' });
      if (currentStatus === 'fulfilled') actions.push({ label: 'Close', action: 'close', color: 'purple' });
    }

    return actions;
  };

  const handleBulkAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selectedOrders.length} orders?`)) return;
    
    setIsProcessing(true);
    setBulkResult('');
    
    const promises = selectedOrders.map(id => api.post(`/orders/${id}/${action}`));
    const results = await Promise.allSettled(promises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;
    
    setBulkResult(`Successfully updated ${successCount} orders. ${failCount > 0 ? `Failed on ${failCount} orders.` : ''}`);
    setIsProcessing(false);
    fetchOrders();
  };

  const exportCSV = () => {
    const csvRows = [];
    const headers = ['Order ID', 'Customer ID', 'Status', 'Total Price', 'Created At'];
    csvRows.push(headers.join(','));

    for (const row of orders) {
      const values = [
        row.id,
        row.user_id,
        row.status,
        row.total_price,
        new Date(row.created_at).toLocaleString()
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const validActions = getValidBulkActions();

  return (
    <div className="min-h-screen bg-gray-900 p-6 font-sans relative">
      <div className="max-w-7xl mx-auto pb-24">
        <header className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8 transition-transform hover:scale-[1.01] duration-300">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Order Management</h1>
            <p className="text-gray-400 text-sm mt-1">Logged in as {user?.name} &bull; <span className="uppercase text-xs font-semibold tracking-wider text-emerald-400">{user?.role}</span></p>
          </div>
          <button 
            onClick={logout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-5 py-2 rounded-lg transition-all font-medium"
          >
            Sign Out
          </button>
        </header>
        
        {bulkResult && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl mb-6 shadow-lg">
            {bulkResult}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <input 
              type="text" 
              placeholder="Search by ID or Item..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
            />
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {user?.role === 'requester' && (
              <Link to="/orders/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 flex-1 md:flex-none text-center">
                + New Draft
              </Link>
            )}
            <button onClick={exportCSV} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg border border-gray-600 transition-all font-medium flex-1 md:flex-none">
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Customer ID</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
              {orders.map(order => (
                <tr key={order.id} className={`transition-colors ${selectedOrders.includes(order.id) ? 'bg-blue-900/20' : 'hover:bg-gray-700/30'}`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="p-4 font-medium text-white">#{order.id}</td>
                  <td className="p-4">{order.user_id}</td>
                  <td className="p-4 text-emerald-400 font-medium">${Number(order.total_price).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'draft' ? 'bg-gray-600 text-gray-200' :
                      order.status === 'approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      order.status === 'fulfilled' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      order.status === 'closed' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      order.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Link to={`/orders/${order.id}`} className="text-blue-400 hover:text-blue-300 mr-4 font-medium transition-colors">View</Link>
                    {user?.role === 'requester' && order.status === 'draft' && (
                      <Link to={`/orders/${order.id}/edit`} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Edit</Link>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-xl border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-4 px-6 z-50 transform transition-transform animate-slide-up">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white font-medium">
              <span className="text-blue-400 font-bold">{selectedOrders.length}</span> orders selected
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                disabled={isProcessing}
              >
                Clear
              </button>
              
              {validActions.length === 0 && (
                <span className="text-gray-500 text-sm py-2">No bulk actions available for mixed statuses.</span>
              )}
              
              {validActions.map(action => (
                <button
                  key={action.action}
                  onClick={() => handleBulkAction(action.action)}
                  disabled={isProcessing}
                  className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-lg ${
                    action.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30' :
                    action.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30' :
                    action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30' :
                    action.color === 'purple' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30' :
                    'bg-gray-600 hover:bg-gray-500 shadow-gray-500/30'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? 'Processing...' : `Bulk ${action.label}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
