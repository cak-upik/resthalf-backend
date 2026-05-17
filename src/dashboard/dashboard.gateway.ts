import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/dashboard",
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DashboardGateway.name);
  // Track connected staff by hotel
  private staffSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket): void {
    const hotelId = client.handshake.query.hotelId as string;
    if (!hotelId) {
      client.disconnect();
      return;
    }
    if (!this.staffSockets.has(hotelId))
      this.staffSockets.set(hotelId, new Set());
    this.staffSockets.get(hotelId)!.add(client.id);
    client.join(`hotel:${hotelId}`); // ★ Hotel-scoped room
    this.logger.log(`Staff connected: hotel=${hotelId}`);
  }

  handleDisconnect(client: Socket): void {
    const hotelId = client.handshake.query.hotelId as string;
    this.staffSockets.get(hotelId)?.delete(client.id);
  }

  emitExpiry(roomId: string, delegationId: string): void {
    this.server.emit("room:expired", {
      roomId,
      delegationId,
      timestamp: new Date().toISOString(),
      message: "Authority window ended. Please verify guest status.",
    });
  }

  emitWholesaleCheckout(data: {
    bookingId: string;
    hotelName: string;
    checkOut: string;
    supplierRef: string;
  }): void {
    this.server.emit("wholesale:checkout", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitRoomUpdate(hotelId: string, roomData: any): void {
    this.server.to(`hotel:${hotelId}`).emit("room:update", roomData);
  }
  
  emitStaffAction(hotelId: string, action: any): void {
    this.server.to(`hotel:${hotelId}`).emit("staff:action", action);
  }
}
