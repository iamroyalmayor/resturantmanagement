import React, { useState } from 'react';
import { Save, Bell, Lock, User, Palette, Clock, DollarSign, Globe, AlertCircle } from 'lucide-react';

interface Settings {
  restaurantName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  operatingHours: { day: string; open: string; close: string; closed: boolean }[];
  taxRate: number;
  serviceCharge: number;
  notifications: {
    emailAlerts: boolean;
    orderNotifications: boolean;
    staffAlerts: boolean;
    reservationReminders: boolean;
  };
  theme: 'light' | 'dark';
}

const initialSettings: Settings = {
  restaurantName: 'The Grand Bistro',
  email: 'info@grandbistro.com',
  phone: '+1-555-0100',
  address: '123 Main Street, Downtown',
  timezone: 'UTC-5',
  currency: 'USD',
  operatingHours: [
    { day: 'Monday', open: '10:00', close: '22:00', closed: false },
    { day: 'Tuesday', open: '10:00', close: '22:00', closed: false },
    { day: 'Wednesday', open: '10:00', close: '22:00', closed: false },
    { day: 'Thursday', open: '10:00', close: '23:00', closed: false },
    { day: 'Friday', open: '10:00', close: '23:30', closed: false },
    { day: 'Saturday', open: '11:00', close: '23:30', closed: false },
    { day: 'Sunday', open: '11:00', close: '21:00', closed: false },
  ],
  taxRate: 8.5,
  serviceCharge: 18,
  notifications: {
    emailAlerts: true,
    orderNotifications: true,
    staffAlerts: true,
    reservationReminders: true,
  },
  theme: 'light',
};

type SettingsTab = 'general' | 'operations' | 'notifications' | 'appearance';

export function Settings() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateOperatingHour = (day: number, field: string, value: any) => {
    const newHours = [...settings.operatingHours];
    newHours[day] = { ...newHours[day], [field]: value };
    setSettings(prev => ({ ...prev, operatingHours: newHours }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your restaurant preferences and operations</p>
        </div>
        <button onClick={handleSave} className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </button>
      </div>

      {saved && (
        <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'general' as const, label: 'General', icon: <Globe className="h-4 w-4" /> },
          { id: 'operations' as const, label: 'Operations', icon: <Clock className="h-4 w-4" /> },
          { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
          { id: 'appearance' as const, label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input type="text" value={settings.restaurantName} onChange={e => updateSetting('restaurantName', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={settings.email} onChange={e => updateSetting('email', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={settings.phone} onChange={e => updateSetting('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={settings.address} onChange={e => updateSetting('address', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations Settings */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
            <div className="space-y-3">
              {settings.operatingHours.map((hours, i) => (
                <div key={hours.day} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{hours.day}</p>
                  </div>
                  {!hours.closed ? (
                    <div className="flex items-center space-x-2">
                      <input type="time" value={hours.open} onChange={e => updateOperatingHour(i, 'open', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" />
                      <span className="text-gray-500">-</span>
                      <input type="time" value={hours.close} onChange={e => updateOperatingHour(i, 'close', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Closed</span>
                  )}
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={hours.closed} onChange={e => updateOperatingHour(i, 'closed', e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={settings.taxRate} onChange={e => updateSetting('taxRate', parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Service Charge (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={settings.serviceCharge} onChange={e => updateSetting('serviceCharge', parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select value={settings.timezone} onChange={e => updateSetting('timezone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  {['UTC-8', 'UTC-7', 'UTC-6', 'UTC-5', 'UTC-4', 'UTC', 'UTC+1', 'UTC+2'].map(tz => <option key={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={settings.currency} onChange={e => updateSetting('currency', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'].map(curr => <option key={curr}>{curr}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'emailAlerts' as const, label: 'Email Alerts', description: 'Receive email notifications for important events' },
              { key: 'orderNotifications' as const, label: 'Order Notifications', description: 'Get notified when new orders arrive' },
              { key: 'staffAlerts' as const, label: 'Staff Alerts', description: 'Notifications for staff-related updates' },
              { key: 'reservationReminders' as const, label: 'Reservation Reminders', description: 'Remind guests about upcoming reservations' },
            ].map(notif => (
              <div key={notif.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{notif.label}</p>
                  <p className="text-sm text-gray-500">{notif.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.notifications[notif.key]} onChange={e => updateSetting(`notifications.${notif.key}`, e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
              <div className="flex space-x-4">
                {['light', 'dark'].map(theme => (
                  <button key={theme} onClick={() => updateSetting('theme', theme)} className={`px-6 py-3 rounded-lg border-2 transition-all font-medium capitalize ${settings.theme === theme ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}>
                    {theme === 'light' ? '☀️' : '🌙'} {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lock className="h-5 w-5 text-orange-600" />
          <span>Security</span>
        </h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Change Password
          </button>
          <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Manage API Keys
          </button>
          <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Two-Factor Authentication
          </button>
        </div>
      </div>
    </div>
  );
}
