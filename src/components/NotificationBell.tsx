import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Star, CheckCircle, Info, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { Link } from 'wouter';

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'rating': return <Star className="w-4 h-4 text-yellow-500" />;
    case 'approval': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'system': return <Settings className="w-4 h-4 text-blue-500" />;
    case 'general':
    default: return <Info className="w-4 h-4 text-netflix-red" />;
  }
};

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        if (n.id) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (n.id) {
          batch.delete(doc(db, 'notifications', n.id));
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 bg-netflix-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[350px] bg-[#141414] border border-gray-800 rounded-lg shadow-2xl overflow-hidden z-[120]"
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="font-bold text-white text-lg">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Clear all</span>
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-700" />
                  </div>
                  <p className="text-base font-medium text-gray-400">No notifications yet</p>
                  <p className="text-xs mt-1">When you get notifications, they'll show up here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {notifications.map((notif, index) => (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b border-gray-800/50 hover:bg-white/5 transition-colors group relative flex gap-3 ${!notif.read ? 'bg-white/[0.03]' : ''}`}
                        onClick={() => {
                          if (!notif.read && notif.id) markAsRead(notif.id);
                        }}
                      >
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-netflix-red"></div>
                        )}
                        
                        <div className="mt-1 flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notif.read ? 'bg-gray-800' : 'bg-transparent'}`}>
                            {getIconForType(notif.type)}
                          </div>
                        </div>

                        <div className="flex-1 pr-8">
                          <h4 className={`text-sm mb-1 ${!notif.read ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                            {notif.title}
                          </h4>
                          <p className={`text-xs line-clamp-2 mb-2 ${!notif.read ? 'text-gray-300' : 'text-gray-500'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-medium tracking-wider">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                            {notif.link && (
                              <Link href={notif.link}>
                                <span className="text-[10px] text-netflix-red hover:text-red-400 font-bold uppercase tracking-wider cursor-pointer transition-colors">
                                  View Details
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.id) deleteNotification(notif.id);
                          }}
                          className="absolute right-3 top-4 text-gray-500 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all bg-[#141414] rounded-full p-1.5 sm:p-1 shadow-md"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
