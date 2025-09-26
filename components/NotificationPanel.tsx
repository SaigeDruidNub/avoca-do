"use client";
import React, { useState } from "react";
import { useNotifications } from "./NotificationProvider";

export function NotificationPanel() {
  const {
    unreadCount,
    unreadBySender,
    notifications,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    notificationPreferences,
    updateNotificationPreferences,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleMarkAsRead = async (senderId: string) => {
    await markAsRead(senderId);
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-foreground hover:bg-primary-dark rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 block h-3 w-3 bg-secondary-dark rounded-full" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  aria-label="Settings"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {showSettings ? (
            /* Settings Panel */
            <div className="p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Notification Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.sound}
                    onChange={(e) =>
                      updateNotificationPreferences({ sound: e.target.checked })
                    }
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Sound notifications
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.desktop}
                    onChange={(e) =>
                      updateNotificationPreferences({
                        desktop: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Desktop notifications
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.email}
                    onChange={(e) =>
                      updateNotificationPreferences({ email: e.target.checked })
                    }
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email notifications
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* Notifications List */
            <div className="max-h-96 overflow-y-auto">
              {unreadBySender.length === 0 && notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No new notifications
                </div>
              ) : (
                <>
                  {/* Recent notifications */}
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.senderName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => clearNotification(index)}
                          className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Unread message counts by sender */}
                  {unreadBySender.map((sender) => (
                    <div
                      key={sender.senderId}
                      className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sender.senderImage && (
                            <img
                              src={sender.senderImage}
                              alt={sender.senderName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {sender.senderName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {sender.count} unread message
                              {sender.count > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkAsRead(sender.senderId)}
                          className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent-dark transition"
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {(unreadBySender.length > 0 || notifications.length > 0) &&
            !showSettings && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear all
                </button>
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-accent hover:text-accent-dark"
                >
                  Mark all read
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
