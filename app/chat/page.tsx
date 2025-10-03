"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import io, { Socket } from "socket.io-client";
import { useNotifications } from "../../components/NotificationProvider";
import { NotificationBadge } from "../../components/NotificationBadge";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface Message {
  _id?: string;
  sender: string;
  senderName?: string;
  recipient: string;
  content: string;
  createdAt?: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const { markAsRead, unreadBySender, refreshUnreadCount } = useNotifications();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [allUsers, setAllUsers] = useState<
    { _id: string; name: string; image?: string; email?: string }[]
  >([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Fetch all users for dropdown and handle URL parameter
  useEffect(() => {
    fetch("/api/user/all")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllUsers(data);
          // Create a lookup map for user names
          const nameMap: Record<string, string> = {};
          data.forEach((user) => {
            nameMap[user._id] = user.name;
          });
          setUserNames(nameMap);

          // Check for 'with' URL parameter to pre-select recipient
          const urlParams = new URLSearchParams(window.location.search);
          const withUserId = urlParams.get("with");
          if (withUserId && data.some((user: any) => user._id === withUserId)) {
            setRecipient(withUserId);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    // Connect socket
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    // Join own room
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((user) => {
        console.log("Fetched user data:", user);
        if (user && user._id) {
          console.log("Setting userId and joining room:", user._id);
          setUserId(user._id);
          socket.emit("join", user._id);
        } else {
          console.error("No user ID found in response");
        }
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
      });
    // Listen for messages
    socket.on("message", (msg: Message) => {
      console.log("Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for socket errors
    socket.on("error", (error: { message: string }) => {
      setError(error.message);
      console.error("Socket error:", error);
    });

    // Handle connection errors
    socket.on("connect_error", (error: Error) => {
      setError("Connection error. Please check if the server is running.");
      console.error("Connection error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user]);

  // Load message history when recipient changes
  useEffect(() => {
    if (!recipient || !userId) return;

    const loadMessageHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/message/history?with=${recipient}`);
        if (response.ok) {
          const history = await response.json();
          console.log("Loaded message history:", history);
          setMessages(history);

          // Mark all messages from this sender as read
          await markAsRead(recipient);
          await refreshUnreadCount();
        } else {
          console.error("Failed to load message history");
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading message history:", error);
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadMessageHistory();
  }, [recipient, userId]);

  // Scroll to bottom on new message
  // Scroll to bottom on new message or after loading history
  useEffect(() => {
    if (!loadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingHistory]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!recipient) {
      setError("Please select a recipient.");
      console.log("No recipient selected");
      return;
    }
    if (!message) {
      setError("Please enter a message.");
      console.log("No message entered");
      return;
    }
    // Get own userId
    const me = await fetch("/api/user/me").then((res) => res.json());
    if (!me || !me._id) {
      setError("Could not determine your user ID.");
      console.log("No user ID found");
      return;
    }
    const payload = {
      sender: me._id,
      recipient,
      content: message,
    };
    console.log(
      "Attempting to send message payload:",
      payload,
      socketRef.current
    );
    if (!socketRef.current) {
      setError("Socket connection not established.");
      console.log("Socket connection not established");
      return;
    }
    socketRef.current.emit("message", payload);
    setMessage("");
    // Refresh the page to update notifications
    window.location.reload();
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-primary p-8">
      {/* Header with back to dashboard link */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <a
          href="/dashboard"
          className="bg-accent text-white px-4 py-2 rounded shadow hover:bg-accent-dark transition flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </a>
        <h1 className="text-2xl font-bold text-foreground">Chat</h1>
      </div>
      <form className="mb-4 flex gap-2" onSubmit={sendMessage}>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="bg-primary-dark text-secondary border rounded px-2 py-1"
        >
          <option value="">Select Recipient</option>
          {allUsers.map((user) => {
            const unreadCount =
              unreadBySender.find((u) => u.senderId === user._id)?.count || 0;
            return (
              <option key={user._id} value={user._id}>
                {user.name} {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
              </option>
            );
          })}
        </select>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-primary-dark text-secondary placeholder:text-secondary/70 border rounded px-2 py-1 flex-1"
        />
        <button
          type="submit"
          className="bg-accent text-white px-4 py-1 rounded"
        >
          Send
        </button>
      </form>
      <div
        className="w-full max-w-md bg-primary-dark rounded shadow p-4 flex flex-col gap-2 overflow-y-auto"
        style={{ height: 400 }}
      >
        {loadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-secondary">
              Loading conversation history...
            </span>
          </div>
        ) : !recipient ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-secondary">
              Select a recipient to start chatting
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-secondary">
              No messages yet. Start the conversation!
            </span>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`p-2 rounded ${
                msg.sender === userId
                  ? "bg-primary text-white ml-auto"
                  : "bg-gray-200 text-black mr-auto"
              }`}
            >
              <span className="block text-xs text-primary">
                {msg.senderName || userNames[msg.sender] || "Unknown User"}
              </span>
              <span>{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
