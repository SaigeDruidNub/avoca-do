import { Server } from "socket.io";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: './.env.local' });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/avocado";
const PORT = process.env.SOCKET_PORT || 4000;

// Use only direct MongoDB client to avoid conflicts
let mongoClient = null;
let messagesCollection = null;
let usersCollection = null;

console.log("Environment check:");
console.log("- MONGODB_URI loaded:", process.env.MONGODB_URI ? "✓" : "✗");
console.log("- Using URI:", MONGO_URI.includes('mongodb+srv') ? "✓ (Atlas cloud)" : "✗ (local fallback)");

// Enhanced MongoDB connection with retry logic
console.log("Attempting to connect to MongoDB...");

const connectWithRetry = async () => {
  try {
    console.log("Connecting to MongoDB...");
    mongoClient = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    await mongoClient.connect();
    
    // Test the connection with a ping
    console.log("Testing database connection...");
    await mongoClient.db().admin().ping();
    console.log("✓ MongoDB ping successful");
    
    // Setup collections
    messagesCollection = mongoClient.db().collection('messages');
    usersCollection = mongoClient.db().collection('users');
    console.log("✓ Database collections initialized");
    
    console.log("✓ MongoDB fully connected and ready for operations");
    
    // Start Socket.IO server only after MongoDB is verified working
    startSocketServer();
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
    console.log("Retrying MongoDB connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('✓ MongoDB client closed');
  }
  process.exit(0);
});

connectWithRetry();

function startSocketServer() {
  const io = new Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    
    // Join room for user
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined room, socket: ${socket.id}`);
      
      // Log current rooms for debugging
      console.log(`📍 Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
    });

    // Handle sending a message
    socket.on("message", async ({ sender, recipient, content }) => {
      console.log("[Socket.IO] Received message event:", { sender, recipient, content });
      
      if (!sender || !recipient || !content) {
        console.error("[Socket.IO] Invalid message data");
        socket.emit("error", { message: "Invalid message data" });
        return;
      }

      // Verify connection is still active
      if (!mongoClient || !messagesCollection || !usersCollection) {
        console.error("[Socket.IO] MongoDB connection not available");
        socket.emit("error", { message: "Database connection lost" });
        return;
      }

      try {
        // Fetch sender name from users collection
        console.log("[Socket.IO] Fetching sender name for ID:", sender);
        const senderUser = await usersCollection.findOne({ _id: new ObjectId(sender) });
        console.log("[Socket.IO] Found sender user:", senderUser);
        const senderName = senderUser?.name || 'Unknown User';
        console.log("[Socket.IO] Using sender name:", senderName);
        
        // Save to DB using direct MongoDB operations
        console.log("[Socket.IO] Saving message to database...");
        const messageDoc = {
          sender: new ObjectId(sender),
          recipient: new ObjectId(recipient),
          content: content,
          createdAt: new Date(),
          read: false
        };
        
        const result = await messagesCollection.insertOne(messageDoc);
        console.log("[Socket.IO] ✅ Message saved successfully:", result.insertedId);
        
        // Create response object matching expected format
        const msg = {
          _id: result.insertedId.toString(),
          sender: sender,
          senderName: senderName,
          recipient: recipient,
          content: content,
          createdAt: messageDoc.createdAt.toISOString(),
          read: false
        };
        
        console.log("📝 Formatted message object:", msg);
        
        // Emit to recipient (if online)
        const recipientRoom = io.sockets.adapter.rooms.get(recipient);
        const recipientCount = recipientRoom?.size || 0;
        console.log(`📤 Emitting message to recipient room: ${recipient}`);
        console.log(`📊 Sockets in recipient room:`, recipientCount);
        
        if (recipientCount > 0) {
          console.log(`✅ Recipient is online, sending message`);
          io.to(recipient).emit("message", msg);
        } else {
          console.log(`⚠️ Recipient is offline, message saved but not delivered`);
        }
        
        // Emit to sender for confirmation
        console.log(`📤 Confirming message to sender: ${sender}`);
        socket.emit("message", msg);
      } catch (error) {
        console.error("[Socket.IO] ❌ Error saving message:", error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to save message";
        if (error.message.includes('timeout')) {
          errorMessage = "Database operation timed out";
        } else if (error.message.includes('buffering')) {
          errorMessage = "Database connection not ready";
        }
        
        socket.emit("error", { message: errorMessage });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  io.listen(PORT);
  console.log(`🚀 Socket.IO realtime server running on port ${PORT}`);
  console.log(`📡 Ready to accept client connections`);
  console.log(`💾 MongoDB connection established and ready`);
}
