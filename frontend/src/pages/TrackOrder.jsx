import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { DEVELOPER_CREDIT } from '../utils/branding';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const STATUS_ICONS = { pending: '⏳', confirmed: '✅', preparing: '👨‍🍳', ready: '🔔', delivered: '🎉', cancelled: '❌' };
const STATUS_DESC = { pending: 'Order received', confirmed: 'Order confirmed', preparing: 'Being prepared', ready: 'Ready for pickup', delivered: 'Delivered!' };

export default function TrackOrder() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/orders/track/${orderNumber}`)
      .then(res => setOrder(res.data.order))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const currentStep = STATUS_STEPS.indexOf(order?.status);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
      <div>
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-4">Order number: {orderNumber}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{STATUS_ICONS[order.status]}</div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Track Order</h1>
          <p className="text-gray-500 text-sm">{order.orderNumber}</p>
        </div>

        <div className="card p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="font-semibold text-gray-900">{order.customer?.name}</div>
            <div className="text-sm text-gray-500 mt-0.5">Total: ₹{order.total}</div>
            <div className="text-sm text-gray-500">Placed: {new Date(order.createdAt).toLocaleString('en-IN')}</div>
          </div>

          {!isCancelled ? (
            <div className="space-y-4">
              {STATUS_STEPS.map((status, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? '✓' : STATUS_ICONS[status]}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className={`pt-2 ${active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                      <div className={`font-semibold capitalize ${active ? 'text-primary-700' : ''}`}>{status}</div>
                      <div className="text-sm">{STATUS_DESC[status]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">❌</div>
              <div className="font-semibold text-red-600">Order Cancelled</div>
              <p className="text-sm text-gray-500 mt-1">This order has been cancelled</p>
            </div>
          )}

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Order Items</h3>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => window.location.reload()} className="btn-secondary w-full text-sm">
            🔄 Refresh Status
          </button>
          <div className="text-center text-xs text-gray-400">{DEVELOPER_CREDIT}</div>
        </div>
      </div>
    </div>
  );
}
