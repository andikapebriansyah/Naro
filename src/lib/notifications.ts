import Notification from '@/lib/models/Notification';
import dbConnect from '@/lib/db';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type:
    | 'task_assigned'
    | 'task_completed'
    | 'task_cancelled'
    | 'payment_received'
    | 'new_applicant'
    | 'application_accepted'
    | 'application_rejected'
    | 'task_completion_request'
    | 'verification_status'
    | 'new_message'
    | 'system';
  relatedId?: string;
  relatedModel?: 'Task' | 'User' | 'Payment' | 'Report';
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await dbConnect();

    const notification = await Notification.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      relatedId: params.relatedId,
      relatedModel: params.relatedModel,
      isRead: false,
    });

    console.log('✅ Notification created:', {
      userId: params.userId,
      type: params.type,
      title: params.title,
    });

    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    // Don't throw error - notification is not critical
    return null;
  }
}

export async function createMultipleNotifications(
  notifications: CreateNotificationParams[]
) {
  try {
    await dbConnect();

    const result = await Notification.insertMany(
      notifications.map((n) => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        relatedId: n.relatedId,
        relatedModel: n.relatedModel,
        isRead: false,
      }))
    );

    console.log(`✅ Created ${result.length} notifications`);

    return result;
  } catch (error) {
    console.error('❌ Failed to create notifications:', error);
    return null;
  }
}
