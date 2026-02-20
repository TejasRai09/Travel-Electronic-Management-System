import { Router } from 'express';
import { verifyToken, AuthenticatedRequest } from '../jwt';
import { Notification } from '../models';

const router = Router();

// Get user's notifications
router.get('/', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email.trim().toLowerCase();
    const { unreadOnly } = req.query;

    const query: any = { recipientEmail: userEmail };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientEmail: userEmail,
      isRead: false
    });

    res.json({ 
      ok: true, 
      notifications,
      unreadCount 
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email.trim().toLowerCase();
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientEmail: userEmail },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    res.json({ ok: true, notification });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ ok: false, error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email.trim().toLowerCase();

    await Notification.updateMany(
      { recipientEmail: userEmail, isRead: false },
      { isRead: true }
    );

    res.json({ ok: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ ok: false, error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email.trim().toLowerCase();
    const { id } = req.params;

    const result = await Notification.deleteOne({ _id: id, recipientEmail: userEmail });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    res.json({ ok: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete notification' });
  }
});

// Helper function to create notifications (exported for use in other routes)
export async function createNotification(
  recipientEmail: string,
  type: 'approval' | 'rejection' | 'vendor_response' | 'request_created' | 'manager_approved' | 'poc_approved' | 'comment',
  title: string,
  message: string,
  relatedRequestId?: string,
  relatedRequestUniqueId?: string
): Promise<void> {
  try {
    // Override recipient for testing if EMAIL_OVERRIDE_RECIPIENT is set
    const originalRecipient = recipientEmail;
    if (process.env.EMAIL_OVERRIDE_RECIPIENT) {
      recipientEmail = process.env.EMAIL_OVERRIDE_RECIPIENT;
      console.log(`[NOTIFICATION OVERRIDE] Original: ${originalRecipient} → Override: ${recipientEmail}`);
    }
    
    await Notification.create({
      recipientEmail: recipientEmail.toLowerCase().trim(),
      type,
      title,
      message,
      relatedRequestId,
      relatedRequestUniqueId,
      isRead: false
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

export default router;
