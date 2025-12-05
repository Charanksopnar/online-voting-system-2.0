import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2 } from 'lucide-react';

export const UserNotifications = () => {
  const { notifications, removeNotification, markAsRead } = useNotification();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <Bell className="text-primary-600" /> Notifications
           </h1>
           <p className="text-gray-500">Stay updated with election news and account alerts.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-600 border">
            {notifications.length} Total
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No new notifications</p>
            </div>
        ) : (
            notifications.map((notif) => (
                <div key={notif.id} className={`bg-white p-5 rounded-lg shadow-sm border-l-4 flex gap-4 ${
                    notif.type === 'SUCCESS' ? 'border-green-500' :
                    notif.type === 'ERROR' ? 'border-red-500' :
                    notif.type === 'WARNING' ? 'border-yellow-500' : 'border-blue-500'
                }`}>
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
            ))
        )}
      </div>
    </div>
  );
};