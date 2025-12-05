import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2 } from 'lucide-react';

export const AdminNotifications = () => {
  const { notifications, removeNotification } = useNotification();
  // In a real app, admins would see system-wide alerts here, distinct from user notifs.
  // We will display all for the demo context.

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
       <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Notifications</h1>
        <p className="text-gray-500">Audit logs and system messages.</p>
      </div>

      <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
            <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No active system alerts.</p>
            </div>
        ) : (
            <div className="divide-y">
                {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 flex gap-4 hover:bg-gray-50 transition">
                         <div className="flex-shrink-0 pt-1">
                            {notif.type === 'SUCCESS' && <CheckCircle className="text-green-500" />}
                            {notif.type === 'ERROR' && <XCircle className="text-red-500" />}
                            {notif.type === 'WARNING' && <AlertTriangle className="text-yellow-500" />}
                            {notif.type === 'INFO' && <Info className="text-blue-500" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                                <span className="text-xs text-gray-400">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{notif.message}</p>
                        </div>
                        <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-red-500 self-start">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};