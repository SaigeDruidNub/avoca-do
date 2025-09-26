"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface NotificationData {
  type: "new_message";
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface UnreadBySender {
  senderId: string;
  senderName: string;
  senderImage?: string;
  count: number;
  latestMessage: string;
}

interface NotificationContextType {
  unreadCount: number;
  unreadBySender: UnreadBySender[];
  notifications: NotificationData[];
  markAsRead: (senderId?: string, messageIds?: string[]) => Promise<void>;
  clearNotification: (index: number) => void;
  clearAllNotifications: () => void;
  refreshUnreadCount: () => Promise<void>;
  notificationPreferences: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  updateNotificationPreferences: (
    preferences: Partial<{ sound: boolean; desktop: boolean; email: boolean }>
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBySender, setUnreadBySender] = useState<UnreadBySender[]>([]);

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    sound: true,
    desktop: true,
    email: false,
  });
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [userId, setUserId] = useState<string>("");

  // Fetch user ID and connect socket
  useEffect(() => {
    if (!session?.user) return;

    const connectSocket = async () => {
      try {
        const userResponse = await fetch("/api/user/me");
        const userData = await userResponse.json();

        if (userData && userData._id) {
          setUserId(userData._id);

          console.log(
            "[NotificationProvider] Connecting to socket:",
            SOCKET_URL
          );
          const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
          setSocket(newSocket);

          newSocket.on("connect", () => {
            console.log("[NotificationProvider] Socket connected successfully");
          });

          newSocket.on("disconnect", () => {
            console.log("[NotificationProvider] Socket disconnected");
          });

          newSocket.on("error", (error: any) => {
            console.error("[NotificationProvider] Socket error:", error);
          });

          newSocket.emit("join", userData._id);
          console.log(
            "[NotificationProvider] Emitted join for user:",
            userData._id
          );

          // Listen for notifications
          newSocket.on("notification", (notificationData: NotificationData) => {
            console.log(
              "[NotificationProvider] Received notification:",
              notificationData
            );
            setNotifications((prev) => [...prev, notificationData]);
            refreshUnreadCount();

            // Play sound if enabled
            if (notificationPreferences.sound) {
              playNotificationSound();
            }

            // Show desktop notification if enabled
            if (notificationPreferences.desktop && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(
                  `New message from ${notificationData.senderName}`,
                  {
                    body: notificationData.message,
                    icon: "/favicon.png",
                  }
                );
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then((permission) => {
                  if (permission === "granted") {
                    new Notification(
                      `New message from ${notificationData.senderName}`,
                      {
                        body: notificationData.message,
                        icon: "/favicon.png",
                      }
                    );
                  }
                });
              }
            }
          });
        }
      } catch (error) {
        console.error("Error connecting socket:", error);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [session?.user]);

  // Fetch notification preferences on mount
  useEffect(() => {
    if (session?.user) {
      fetchNotificationPreferences();
      refreshUnreadCount();
    }
  }, [session?.user]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification-sound.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to system beep or silent fail
        console.log("Could not play notification sound");
      });
    } catch (error) {
      console.log("Audio not available");
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setNotificationPreferences(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const refreshUnreadCount = async () => {
    if (!session?.user) {
      console.log(
        "[NotificationProvider] No session, skipping unread count refresh"
      );
      setUnreadCount(0);
      setUnreadBySender([]);
      return;
    }

    try {
      const response = await fetch("/api/notifications/unread");
      if (response.ok) {
        const data = await response.json();
        console.log("[NotificationProvider] Unread count data:", data);
        setUnreadCount(data.totalUnread);
        setUnreadBySender(data.unreadBySender);
      } else {
        if (response.status === 401) {
          // Unauthorized, clear notifications
          setUnreadCount(0);
          setUnreadBySender([]);
        }
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
      setUnreadBySender([]);
    }
  };

  const markAsRead = async (senderId?: string, messageIds?: string[]) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId, messageIds }),
      });

      if (response.ok) {
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const clearNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateNotificationPreferences = async (
    preferences: Partial<{ sound: boolean; desktop: boolean; email: boolean }>
  ) => {
    try {
      const updatedPreferences = { ...notificationPreferences, ...preferences };
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifications: updatedPreferences }),
      });

      if (response.ok) {
        setNotificationPreferences(updatedPreferences);
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        unreadBySender,
        notifications,
        markAsRead,
        clearNotification,
        clearAllNotifications,
        refreshUnreadCount,
        notificationPreferences,
        updateNotificationPreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
