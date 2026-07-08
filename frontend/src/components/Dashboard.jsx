import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchOrders = () => {
    api.get('/orders', { params: { search, status } })
      .then(res => setOrders(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, status]);

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

  return (
    <div className="min-h-screen bg-gray-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
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
                <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
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
                  <td colSpan="6" className="p-8 text-center text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
