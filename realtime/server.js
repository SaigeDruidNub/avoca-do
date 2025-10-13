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

// Enhanced MongoDB connection with retry logic

const connectWithRetry = async () => {
  try {
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
    await mongoClient.db().admin().ping();
    
    // Setup collections
    messagesCollection = mongoClient.db().collection('messages');
    usersCollection = mongoClient.db().collection('users');
    
    // Start Socket.IO server only after MongoDB is verified working
    startSocketServer();
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
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
    // Join room for user
    socket.on("join", (userId) => {
      socket.join(userId);
    });

    // Handle sending a message
    socket.on("message", async ({ sender, recipient, content }) => {
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
        const senderUser = await usersCollection.findOne({ _id: new ObjectId(sender) });
        const senderName = senderUser?.name || 'Unknown User';
        
        // Save to DB using direct MongoDB operations
        const messageDoc = {
          sender: new ObjectId(sender),
          recipient: new ObjectId(recipient),
          content: content,
          createdAt: new Date(),
          read: false
        };
        
        const result = await messagesCollection.insertOne(messageDoc);
        
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
        
        // Emit to recipient (if online)
        const recipientRoom = io.sockets.adapter.rooms.get(recipient);
        const recipientCount = recipientRoom?.size || 0;
        
        if (recipientCount > 0) {
          io.to(recipient).emit("message", msg);
          
          // Also emit a notification event for badges/alerts
          io.to(recipient).emit("notification", {
            type: "new_message",
            senderId: sender,
            senderName: senderName,
            message: content,
            timestamp: messageDoc.createdAt.toISOString(),
          });
        }
        
        // Emit to sender for confirmation
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
      // Client disconnected
    });
  });

  io.listen(PORT);
}
