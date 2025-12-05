import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '../types';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification['type'], title: string, message: string) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: Notification['type'], title: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, markAsRead }}>
      {children}
      {/* Global Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto transform transition-all duration-300 ease-in-out translate-y-0 opacity-100 flex items-start p-4 rounded-lg shadow-lg border-l-4 ${
              notif.type === 'SUCCESS' ? 'bg-white border-green-500' :
              notif.type === 'ERROR' ? 'bg-white border-red-500' :
              notif.type === 'WARNING' ? 'bg-white border-yellow-500' :
              'bg-white border-blue-500'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {notif.type === 'SUCCESS' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notif.type === 'ERROR' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {notif.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {notif.type === 'INFO' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800">{notif.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
            </div>
            <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};