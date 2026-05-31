import React, { useState, useEffect } from 'react';
import { Save, Bell, Lock, Palette, Clock, Globe, AlertCircle, Table as TableIcon, Plus } from 'lucide-react';
import { appConfig } from '../config/app';

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

interface TableSetting {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
}

type SettingsTab = 'general' | 'operations' | 'notifications' | 'appearance' | 'tables' | 'emailTemplates' | 'integrations' | 'roles' | 'printTemplates';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface IntegrationSettings {
  firebaseServerKey?: string;
  firebaseProjectId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
}

interface Role {
  id: string;
  name: string;
  permissions: {
    pos?: boolean;
    kitchen?: boolean;
    inventory?: boolean;
    reports?: boolean;
    settings?: boolean;
    accounting?: boolean;
  };
}

const initialSettings: Settings = {
  restaurantName: appConfig.appName,
  email: appConfig.companyEmail,
  phone: '+1-555-0100',
  address: '123 Main Street, Downtown',
  timezone: appConfig.defaultTimezone,
  currency: appConfig.currencyCode,
  operatingHours: [
    { day: 'Monday', open: '10:00', close: '22:00', closed: false },
    { day: 'Tuesday', open: '10:00', close: '22:00', closed: false },
    { day: 'Wednesday', open: '10:00', close: '22:00', closed: false },
    { day: 'Thursday', open: '10:00', close: '23:00', closed: false },
    { day: 'Friday', open: '10:00', close: '23:30', closed: false },
    { day: 'Saturday', open: '11:00', close: '23:30', closed: false },
    { day: 'Sunday', open: '11:00', close: '21:00', closed: false },
  ],
  taxRate: appConfig.taxRate * 100,
  serviceCharge: appConfig.serviceCharge * 100,
  notifications: {
    emailAlerts: true,
    orderNotifications: true,
    staffAlerts: true,
    reservationReminders: true,
  },
  theme: 'light',
};

const initialTableSettings: TableSetting[] = [
  { id: 'table-1', number: 1, capacity: 4, status: 'available' },
  { id: 'table-2', number: 2, capacity: 2, status: 'reserved' },
  { id: 'table-3', number: 3, capacity: 6, status: 'occupied' },
];

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'order_status', name: 'Order Status Update', subject: 'Your order {{orderNumber}} is {{status}}', body: 'Hi {{customerName}},\n\nYour order {{orderNumber}} is now {{status}}.\n\nThank you,\n{{restaurantName}}' },
  { id: 'manager_notification', name: 'Manager Notification', subject: 'New high value order {{orderNumber}}', body: 'Manager,\n\nAn order {{orderNumber}} valued at {{total}} has been placed.\n\nReview in the dashboard.' },
];

const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  firebaseServerKey: '',
  firebaseProjectId: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFromNumber: '',
};

const DEFAULT_ROLES: Role[] = [
  { id: 'role-admin', name: 'Admin', permissions: { pos: true, kitchen: true, inventory: true, reports: true, settings: true, accounting: true } },
  { id: 'role-staff', name: 'Staff', permissions: { pos: true, kitchen: true, inventory: false, reports: false, settings: false, accounting: false } },
];

const DEFAULT_PRINT_TEMPLATES = {
  receipt: '<div>{{restaurantName}} - Receipt</div>\n<div>Order: {{orderNumber}}</div>',
};

export function Settings() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(DEFAULT_INTEGRATIONS);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [printTemplates, setPrintTemplates] = useState<{ [k: string]: string }>(DEFAULT_PRINT_TEMPLATES);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [tableSettings, setTableSettings] = useState<TableSetting[]>(initialTableSettings);
  const [nextTableNumber, setNextTableNumber] = useState(initialTableSettings.length + 1);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    try {
      const payload = { settings, emailTemplates, integrations, roles, printTemplates, tableSettings };
      localStorage.setItem('app_settings', JSON.stringify(payload));
    } catch (err) {
      // ignore storage errors
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.emailTemplates) setEmailTemplates(parsed.emailTemplates);
      if (parsed.integrations) setIntegrations(parsed.integrations);
      if (parsed.roles) setRoles(parsed.roles);
      if (parsed.printTemplates) setPrintTemplates(parsed.printTemplates);
      if (parsed.tableSettings) setTableSettings(parsed.tableSettings);
    } catch (err) {
      // ignore parse errors
    }
  }, []);

  const addTable = () => {
    setTableSettings((prev) => [
      ...prev,
      { id: `table-${Date.now()}`, number: nextTableNumber, capacity: 4, status: 'available' },
    ]);
    setNextTableNumber((value) => value + 1);
  };

  const removeTable = (id: string) => {
    setTableSettings((prev) => prev.filter((table) => table.id !== id));
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
          { id: 'tables' as const, label: 'Tables', icon: <TableIcon className="h-4 w-4" /> },
          { id: 'emailTemplates' as const, label: 'Email Templates', icon: <Save className="h-4 w-4" /> },
          { id: 'integrations' as const, label: 'Integrations', icon: <Bell className="h-4 w-4" /> },
          { id: 'roles' as const, label: 'User Roles', icon: <Lock className="h-4 w-4" /> },
          { id: 'printTemplates' as const, label: 'Print Templates', icon: <Save className="h-4 w-4" /> },
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
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'JPY'].map(curr => <option key={curr}>{curr}</option>)}
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

      {/* Email Templates */}
      {activeTab === 'emailTemplates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
          <p className="text-sm text-gray-500">Edit canned email templates. Use placeholders like <span className="font-mono">{'{{orderNumber}}'}</span>, <span className="font-mono">{'{{customerName}}'}</span>, <span className="font-mono">{'{{restaurantName}}'}</span>.</p>
          <div className="space-y-4">
            {emailTemplates.map((t, idx) => (
              <div key={t.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input type="text" value={t.subject} onChange={e => setEmailTemplates(prev => prev.map(p => p.id === t.id ? { ...p, subject: e.target.value } : p))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  <textarea value={t.body} onChange={e => setEmailTemplates(prev => prev.map(p => p.id === t.id ? { ...p, body: e.target.value } : p))} rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-lg">
              <h4 className="font-medium mb-2">Firebase</h4>
              <label className="block text-sm text-gray-600 mb-1">Project ID</label>
              <input type="text" value={integrations.firebaseProjectId} onChange={e => setIntegrations(s => ({ ...s, firebaseProjectId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-2" />
              <label className="block text-sm text-gray-600 mb-1">Server Key</label>
              <input type="text" value={integrations.firebaseServerKey} onChange={e => setIntegrations(s => ({ ...s, firebaseServerKey: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="p-4 border border-gray-100 rounded-lg">
              <h4 className="font-medium mb-2">Twilio</h4>
              <label className="block text-sm text-gray-600 mb-1">Account SID</label>
              <input type="text" value={integrations.twilioAccountSid} onChange={e => setIntegrations(s => ({ ...s, twilioAccountSid: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-2" />
              <label className="block text-sm text-gray-600 mb-1">Auth Token</label>
              <input type="password" value={integrations.twilioAuthToken} onChange={e => setIntegrations(s => ({ ...s, twilioAuthToken: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-2" />
              <label className="block text-sm text-gray-600 mb-1">From Number</label>
              <input type="text" value={integrations.twilioFromNumber} onChange={e => setIntegrations(s => ({ ...s, twilioFromNumber: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>
        </div>
      )}

      {/* Roles Management */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Roles</h3>
            <button onClick={() => setRoles(prev => [...prev, { id: `role-${Date.now()}`, name: 'New Role', permissions: {} }])} className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white">Create Role</button>
          </div>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <input value={r.name} onChange={e => setRoles(prev => prev.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="rounded-lg border border-gray-300 px-2 py-1" />
                  <button onClick={() => setRoles(prev => prev.filter(x => x.id !== r.id))} className="text-xs text-red-600">Delete</button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {(['pos','kitchen','inventory','reports','settings','accounting'] as const).map(p => (
                    <label key={p} className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={!!(r.permissions as any)[p]} onChange={e => setRoles(prev => prev.map(x => x.id === r.id ? { ...x, permissions: { ...x.permissions, [p]: e.target.checked } } : x))} />
                      <span className="capitalize">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Templates */}
      {activeTab === 'printTemplates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Print Templates</h3>
          <p className="text-sm text-gray-500">Edit HTML templates used for receipts and kitchen tickets. Use simple placeholders like <span className="font-mono">{'{{orderNumber}}'}</span>.</p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Template (HTML)</label>
            <textarea value={printTemplates.receipt} onChange={e => setPrintTemplates(prev => ({ ...prev, receipt: e.target.value }))} rows={8} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
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
                    {theme === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables Settings */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Table Settings</h3>
                <p className="text-sm text-gray-500">Manage table capacity, status, and reservation readiness.</p>
              </div>
              <button onClick={addTable} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                <Plus className="h-4 w-4" /> Add Table
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {tableSettings.map((table) => (
                <div key={table.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Table {table.number}</p>
                      <h4 className="text-2xl font-bold text-gray-900">Capacity {table.capacity}</h4>
                    </div>
                    <button onClick={() => removeTable(table.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${table.status === 'available' ? 'bg-green-100 text-green-700' : table.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' : table.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {table.status}
                    </span>
                    <span>Ready for use or reservation assignment.</span>
                  </div>
                </div>
              ))}
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
