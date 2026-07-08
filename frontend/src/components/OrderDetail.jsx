import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrder = () => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleTransition = async (action, data = {}) => {
    if (['submit', 'approve', 'fulfill', 'close', 'cancel'].includes(action)) {
      if (!window.confirm(`Are you sure you want to ${action} this order?`)) return;
    }
    try {
      setErrorMsg('');
      await api.post(`/orders/${id}/${action}`, data);
      setShowRejectModal(false);
      setRejectReason('');
      fetchOrder();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating order status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await api.delete(`/orders/${id}`);
        navigate('/');
      } catch (err) {
        setErrorMsg('Error deleting draft');
      }
    }
  };

  if (!order) return <div className="p-6 text-white text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            Order #{order.id}
            <span className="text-sm px-3 py-1 bg-gray-800 border border-gray-700 rounded-full font-normal">
              {order.status.toUpperCase()}
            </span>
          </h2>
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">Back to Dashboard</Link>
        </div>

        {errorMsg && <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl">{errorMsg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold border-b border-gray-700 pb-3 mb-4">Line Items</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Price Snapshot</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {order.order_lines.map(line => (
                    <tr key={line.id}>
                      <td className="py-3">{line.item?.name || 'Unknown Item'}</td>
                      <td className="py-3">${line.price_snapshot}</td>
                      <td className="py-3">{line.quantity}</td>
                      <td className="py-3 text-right font-medium">${(line.price_snapshot * line.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right text-2xl font-bold text-emerald-400">
                Total: ${Number(order.total_price).toFixed(2)}
              </div>
            </div>

            {order.reject_reason && (
              <div className="bg-orange-500/10 border border-orange-500/50 p-5 rounded-2xl text-orange-200">
                <strong>Rejection Reason:</strong> {order.reject_reason}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold border-b border-gray-700 pb-3 mb-4">Actions</h3>
              <div className="space-y-3">
                {user?.role === 'requester' && order.status === 'draft' && (
                  <>
                    <button onClick={() => handleTransition('submit')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors font-medium">Submit Order</button>
                    <Link to={`/orders/${id}/edit`} className="block text-center w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium">Edit Draft</Link>
                    <button onClick={handleDelete} className="w-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 py-2 rounded-lg transition-colors font-medium">Delete Draft</button>
                  </>
                )}
                {user?.role === 'requester' && ['draft', 'submitted'].includes(order.status) && (
                  <button onClick={() => handleTransition('cancel')} className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors font-medium">Cancel Order</button>
                )}
                {user?.role === 'requester' && order.status === 'rejected' && (
                  <button onClick={() => handleTransition('revise')} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition-colors font-medium">Revise (Return to Draft)</button>
                )}

                {user?.role === 'approver' && order.status === 'submitted' && (
                  <>
                    <button onClick={() => handleTransition('approve')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition-colors font-medium">Approve</button>
                    <button onClick={() => setShowRejectModal(true)} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-medium">Reject</button>
                  </>
                )}
                {user?.role === 'approver' && order.status === 'approved' && (
                  <button onClick={() => handleTransition('fulfill')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors font-medium">Fulfill Order</button>
                )}
                {user?.role === 'approver' && order.status === 'fulfilled' && (
                  <button onClick={() => handleTransition('close')} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors font-medium">Close Order</button>
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl font-semibold border-b border-gray-700 pb-3 mb-4">Activity Logs</h3>
              <div className="space-y-4">
                {order.activity_logs.map(log => (
                  <div key={log.id} className="relative pl-4 border-l-2 border-gray-600">
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5"></div>
                    <p className="text-sm font-medium text-gray-200">{log.to_status.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">By {log.user?.name} on {new Date(log.created_at).toLocaleString()}</p>
                    {log.comment && <p className="text-xs text-gray-300 mt-1 italic">"{log.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Reject Order</h3>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 min-h-[100px]"
              ></textarea>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancel</button>
                <button onClick={() => handleTransition('reject', { reason: rejectReason })} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">Confirm Rejection</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
