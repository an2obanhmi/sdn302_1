import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { broadcastUserEvent } from "@/lib/realtime";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });

    // Broadcast live event to the recipient
    await broadcastUserEvent(params.userId, "notification:new", notification);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
