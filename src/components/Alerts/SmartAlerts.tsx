import React from 'react';
import { AlertCircle, TrendingUp, Package, Clock, Wifi } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  icon: React.ReactNode;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SmartAlerts() {
  const [alerts] = React.useState<Alert[]>([
    {
      id: '1',
      type: 'danger',
      title: 'Low Stock Alert',
      message: 'Tomatoes: 2 units left. Recommend restocking today.',
      icon: <Package className="w-5 h-5" />,
      timestamp: '5 min ago',
      action: {
        label: 'Restock Now',
        onClick: () => console.log('Restocking...'),
      },
    },
    {
      id: '2',
      type: 'warning',
      title: 'Peak Hours Incoming',
      message: 'Expected high volume in 30 minutes. Staff availability: 8/10',
      icon: <TrendingUp className="w-5 h-5" />,
      timestamp: '10 min ago',
      action: {
        label: 'View Staff',
        onClick: () => console.log('Viewing staff...'),
      },
    },
    {
      id: '3',
      type: 'warning',
      title: 'Kitchen Delays',
      message: '3 orders delayed by 10 minutes due to high volume.',
      icon: <Clock className="w-5 h-5" />,
      timestamp: '15 min ago',
      action: {
        label: 'View Orders',
        onClick: () => console.log('Viewing orders...'),
      },
    },
    {
      id: '4',
      type: 'info',
      title: 'WhatsApp Orders Pending',
      message: 'You have 5 new orders from WhatsApp waiting for confirmation.',
      icon: <Wifi className="w-5 h-5" />,
      timestamp: '2 min ago',
      action: {
        label: 'Review Orders',
        onClick: () => console.log('Reviewing orders...'),
      },
    },
  ]);

  const typeStyles = {
    danger: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const iconStyles = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        Smart Alerts
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 flex gap-4 ${typeStyles[alert.type]}`}
          >
            <div className={`flex-shrink-0 ${iconStyles[alert.type]}`}>
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{alert.title}</p>
              <p className="text-sm opacity-90 mt-1">{alert.message}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs opacity-75">{alert.timestamp}</span>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className="text-xs font-semibold hover:opacity-75 transition"
                  >
                    {alert.action.label} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
