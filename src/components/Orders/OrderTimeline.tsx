import React from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Order } from '../../types/order';
import { formatTime } from '../../utils';

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const timelineEvents = [
    {
      status: 'pending',
      label: 'Order Created',
      time: order.createdAt,
      completed: true,
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      status: 'confirmed',
      label: 'Order Confirmed',
      time: order.confirmedAt,
      completed: !!order.confirmedAt,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      status: 'preparing',
      label: 'Preparation Started',
      time: order.confirmedAt, // Usually starts when confirmed
      completed: ['preparing', 'ready', 'served', 'completed'].includes(order.status),
      icon: Clock,
      color: 'text-orange-500'
    },
    {
      status: 'ready',
      label: 'Order Ready',
      time: order.readyAt,
      completed: !!order.readyAt,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      status: 'served',
      label: 'Order Served',
      time: order.servedAt,
      completed: !!order.servedAt,
      icon: CheckCircle,
      color: 'text-purple-500'
    },
    {
      status: 'completed',
      label: 'Order Completed',
      time: order.completedAt,
      completed: !!order.completedAt,
      icon: CheckCircle,
      color: 'text-gray-500'
    }
  ];

  // Add cancelled event if order is cancelled
  if (order.status === 'cancelled') {
    timelineEvents.push({
      status: 'cancelled',
      label: 'Order Cancelled',
      time: order.updatedAt,
      completed: true,
      icon: XCircle,
      color: 'text-red-500'
    });
  }

  const relevantEvents = order.status === 'cancelled' 
    ? timelineEvents.filter(event => event.status === 'pending' || event.status === 'cancelled')
    : timelineEvents.filter(event => event.status !== 'cancelled');

  return (
    <div className="space-y-4">
      {relevantEvents.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === relevantEvents.length - 1;
        
        return (
          <div key={event.status} className="relative flex items-start">
            {/* Timeline line */}
            {!isLast && (
              <div className={`absolute left-4 top-8 w-0.5 h-8 ${
                event.completed ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            )}
            
            {/* Timeline dot */}
            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              event.completed 
                ? 'bg-white border-green-500' 
                : 'bg-gray-100 border-gray-300'
            }`}>
              <Icon className={`w-4 h-4 ${
                event.completed ? event.color : 'text-gray-400'
              }`} />
            </div>
            
            {/* Event details */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${
                  event.completed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {event.label}
                </h4>
                {event.time && (
                  <span className="text-xs text-gray-500">
                    {formatTime(event.time)}
                  </span>
                )}
              </div>
              
              {/* Additional info for specific events */}
              {event.status === 'ready' && order.actualPrepTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Prepared in {order.actualPrepTime} minutes
                  {order.estimatedPrepTime && order.actualPrepTime > order.estimatedPrepTime && (
                    <span className="text-orange-600 ml-1">
                      ({order.actualPrepTime - order.estimatedPrepTime} min over estimate)
                    </span>
                  )}
                </p>
              )}
              
              {event.status === 'preparing' && order.estimatedPrepTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Estimated prep time: {order.estimatedPrepTime} minutes
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}