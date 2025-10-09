import { io, Socket } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../constants";
import AuthService from "./AuthService";

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    // We can't directly access the private authToken property
    // Let's assume the token is passed in or stored elsewhere
    const token = AuthService.getAuthToken();
    if (!token) {
      console.error("No auth token available for WebSocket connection");
      return;
    }

    // Disconnect existing socket if present
    if (this.socket) {
      this.socket.disconnect();
    }

    // Create new socket connection
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.handleReconnect();
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  // Squad chat methods
  joinSquad(squadId: string) {
    if (this.socket) {
      this.socket.emit("join_squad", squadId);
    }
  }

  leaveSquad(squadId: string) {
    if (this.socket) {
      this.socket.emit("leave_squad", squadId);
    }
  }

  sendMessage(
    squadId: string,
    message: string,
    messageType: string = "text",
    attachments: string[] = []
  ) {
    if (this.socket) {
      this.socket.emit("send_message", {
        squadId,
        message,
        messageType,
        attachments,
      });
    }
  }

  startTyping(squadId: string) {
    if (this.socket) {
      this.socket.emit("typing_start", squadId);
    }
  }

  stopTyping(squadId: string) {
    if (this.socket) {
      this.socket.emit("typing_stop", squadId);
    }
  }

  // Notification methods
  subscribeToNotifications() {
    if (this.socket) {
      this.socket.emit("subscribe_notifications");
    }
  }

  unsubscribeFromNotifications() {
    if (this.socket) {
      this.socket.emit("unsubscribe_notifications");
    }
  }

  // Project subscription methods
  subscribeToProject(projectId: string) {
    if (this.socket) {
      this.socket.emit("subscribe_project", projectId);
    }
  }

  unsubscribeFromProject(projectId: string) {
    if (this.socket) {
      this.socket.emit("unsubscribe_project", projectId);
    }
  }

  // Challenge subscription methods
  subscribeToChallenge(challengeId: string) {
    if (this.socket) {
      this.socket.emit("subscribe_challenge", challengeId);
    }
  }

  unsubscribeFromChallenge(challengeId: string) {
    if (this.socket) {
      this.socket.emit("unsubscribe_challenge", challengeId);
    }
  }

  // Event listener methods
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Status update method
  updateStatus(status: string) {
    if (this.socket) {
      this.socket.emit("update_status", status);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
