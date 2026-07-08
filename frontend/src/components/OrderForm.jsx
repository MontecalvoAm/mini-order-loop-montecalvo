import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

const productImages = {
  'Laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80',
  'Mouse': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80',
  'Keyboard': 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80',
  'Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80',
  'default': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=500&q=80'
};

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({}); // { item_id: quantity }
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/items').then(res => setItems(res.data.data));
    
    if (id) {
      api.get(`/orders/${id}`).then(res => {
        const order = res.data.data;
        if (order.status !== 'draft') {
          navigate('/');
        }
        const initialCart = {};
        order.order_lines.forEach(line => {
          initialCart[line.item_id] = line.quantity;
        });
        setCart(initialCart);
      });
    }
  }, [id, navigate]);

  const addToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = items.find(i => String(i.id) === String(itemId));
      if (item) total += item.price * qty;
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) {
      setErrorMsg('Please add at least one product to your order.');
      return;
    }
    
    const lines = Object.entries(cart).map(([item_id, quantity]) => ({
      item_id: parseInt(item_id),
      quantity
    }));

    setIsSubmitting(true);
    try {
      if (id) {
        await api.put(`/orders/${id}`, { lines });
      } else {
        await api.post('/orders', { lines });
      }
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] p-6 text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-gray-900/50 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
          <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
            {id ? 'Edit Draft Order' : 'Product Catalog'}
          </h2>
          <Link to="/" className="text-gray-400 hover:text-white transition-colors bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-700 hover:border-gray-500 hover:shadow-lg shadow-black/50">
            &larr; Dashboard
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(item => {
              const qtyInCart = cart[item.id] || 0;
              const imgUrl = productImages[item.name] || productImages['default'];
              return (
                <div key={item.id} className="group bg-gray-900/40 rounded-3xl overflow-hidden border border-gray-800 hover:border-blue-500/30 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)]">
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
                    <img src={imgUrl} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700 text-xs font-semibold">
                      Stock: <span className={item.stock > 0 ? "text-emerald-400" : "text-red-400"}>{item.stock}</span>
                    </div>
                  </div>
                  <div className="p-6 relative z-20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{item.name}</h3>
                        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">${item.price}</p>
                      </div>
                    </div>
                    
                    {qtyInCart === 0 ? (
                      <button 
                        onClick={() => addToCart(item.id)}
                        disabled={item.stock === 0}
                        className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                          item.stock > 0 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)]' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {item.stock > 0 ? 'Add to Order' : 'Out of Stock'}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-800 p-2 rounded-xl border border-gray-700">
                        <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                        </button>
                        <span className="font-bold text-lg w-12 text-center">{qtyInCart}</span>
                        <button onClick={() => addToCart(item.id)} className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 sticky top-6 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                Your Order
              </h3>
              
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(cart).length === 0 ? (
                  <div className="text-gray-500 text-center py-8 bg-gray-800/50 rounded-2xl border border-gray-800 border-dashed">
                    Your order is empty.<br/>Add some products!
                  </div>
                ) : (
                  Object.entries(cart).map(([itemId, qty]) => {
                    const item = items.find(i => String(i.id) === String(itemId));
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex justify-between items-center bg-gray-800/80 p-4 rounded-2xl border border-gray-700">
                        <div>
                          <p className="font-semibold text-gray-200">{item.name}</p>
                          <p className="text-sm text-gray-400">${item.price} x {qty}</p>
                        </div>
                        <div className="font-bold text-emerald-400">
                          ${(item.price * qty).toFixed(2)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-800 pt-6">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-3xl font-black text-white">${calculateTotal().toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || Object.keys(cart).length === 0}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    Object.keys(cart).length > 0 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)] transform hover:-translate-y-1' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Draft Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
