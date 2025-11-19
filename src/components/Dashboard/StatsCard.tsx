import React from 'react';
import { StatsCardProps } from '../../types';

const colorClasses = {
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    bgLight: 'bg-orange-50',
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    bgLight: 'bg-green-50',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    bgLight: 'bg-blue-50',
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    bgLight: 'bg-red-50',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    bgLight: 'bg-purple-50',
  },
};

export function StatsCard({ title, value, change, changeType, icon: Icon, color }: StatsCardProps) {
  const colors = colorClasses[color];
  
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="mt-2 flex items-center text-xs sm:text-sm">
            <ChangeIndicator change={change} changeType={changeType} />
            <span className="ml-2 text-gray-500 hidden sm:inline">vs last week</span>
          </div>
        </div>
        <div className={`rounded-lg p-2 sm:p-3 ${colors.bgLight} flex-shrink-0`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.bg}`} />
    </div>
  );
}

interface ChangeIndicatorProps {
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

function ChangeIndicator({ change, changeType }: ChangeIndicatorProps) {
  const getChangeClasses = () => {
    switch (changeType) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getChangeClasses()}`}>
      {change}
    </span>
  );
}