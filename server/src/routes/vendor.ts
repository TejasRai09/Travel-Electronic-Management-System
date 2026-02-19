import { Router } from 'express';
import { TravelRequest, Employee, User } from '../models.js';
import { verifyToken, type AuthenticatedRequest } from '../jwt.js';
import { createNotification } from './notifications.js';

const router = Router();

// Middleware to verify Vendor role
async function verifyVendor(req: AuthenticatedRequest, res: any, next: any) {
  try {
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.isVendor) {
      return res.status(403).json({ ok: false, error: 'Access denied. Vendor role required.' });
    }
    next();
  } catch (err) {
    console.error('Error verifying vendor:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}

// Get pending requests (approved by POC, awaiting vendor action)
router.get('/pending', verifyToken, verifyVendor, async (req: AuthenticatedRequest, res) => {
  try {
    const rawRequests = await TravelRequest.find({ 
      status: 'Approved'
    }).sort({ pocApprovedAt: -1 });
    
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: obj.department || 'N/A'
      };
    });
    
    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Error fetching vendor pending requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Get completed/handled requests
router.get('/approved', verifyToken, verifyVendor, async (req: AuthenticatedRequest, res) => {
  try {
    // For now, we'll show the same as pending. Later you can add a new status like "VendorHandled"
    const rawRequests = await TravelRequest.find({ 
      status: 'Approved',
      vendorMessages: { $exists: true, $ne: [] }
    }).sort({ createdAt: -1 });
    
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: obj.department || 'N/A'
      };
    });
    
    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Error fetching vendor approved requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Send vendor message with attachments
router.post('/requests/:id/message', verifyToken, verifyVendor, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    const user = await User.findOne({ email: req.user!.email });
    const vendorName = user?.name || req.user!.email;

    // Initialize vendorMessages array if not exists
    if (!request.vendorMessages) {
      request.vendorMessages = [];
    }

    // Add vendor message
    request.vendorMessages.push({
      message: message || '',
      attachments: attachments || [],
      sentBy: req.user!.email,
      sentByName: vendorName,
      sentAt: new Date()
    });

    // Also add a system message to chat for visibility
    if (!request.chatMessages) request.chatMessages = [];
    request.chatMessages.push({
      sender: 'system@zuari.com',
      senderName: 'System',
      message: `Vendor (${vendorName}) has sent a response. Check vendor messages section below.`,
      timestamp: new Date()
    });

    await request.save();
    
    // Notify employee about vendor response
    const hasAttachments = attachments && attachments.length > 0;
    await createNotification(
      request.originatorEmail,
      'vendor_response',
      'Vendor Response Received',
      `Vendor sent ${hasAttachments ? `${attachments.length} ticket option(s)` : 'a response'} for request ${request.uniqueId}`,
      request._id.toString(),
      request.uniqueId
    );
    
    // Also notify manager
    const employee = await Employee.findOne({ email: request.originatorEmail });
    if (employee?.managerEmail) {
      await createNotification(
        employee.managerEmail,
        'vendor_response',
        'Vendor Response Available',
        `Vendor sent response for ${employee.employeeName}'s travel request ${request.uniqueId}`,
        request._id.toString(),
        request.uniqueId
      );
    }

    res.json({ 
      ok: true, 
      vendorMessages: request.vendorMessages 
    });
  } catch (err) {
    console.error('Error sending vendor message:', err);
    res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
});

// Send/receive vendor chat messages (two-way communication)
router.post('/requests/:id/chat', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Message cannot be empty' });
    }

    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    const user = await User.findOne({ email: req.user!.email });
    
    // Verify user is either the vendor or the requester
    const isVendor = user?.isVendor;
    const isRequester = req.user!.email === request.originatorEmail;
    
    if (!isVendor && !isRequester) {
      return res.status(403).json({ ok: false, error: 'Access denied. Only vendor and requester can participate in this chat.' });
    }

    // Initialize vendorChatMessages array if not exists
    if (!request.vendorChatMessages) {
      request.vendorChatMessages = [];
    }

    // Add chat message
    request.vendorChatMessages.push({
      sender: req.user!.email,
      senderName: user?.profile?.fullName || user?.email || req.user!.email,
      message: message.trim(),
      timestamp: new Date()
    });

    await request.save();
    
    // Send notification to the other party
    if (isVendor) {
      // Vendor sent message, notify requester
      await createNotification(
        request.originatorEmail,
        'comment',
        'New message from vendor',
        `Vendor replied in request ${request.uniqueId}`,
        request._id.toString(),
        request.uniqueId
      );
    } else {
      // Requester sent message, notify vendor (find vendor from previous messages)
      const lastVendorMessage = request.vendorMessages?.[request.vendorMessages.length - 1];
      if (lastVendorMessage?.sentBy) {
        await createNotification(
          lastVendorMessage.sentBy,
          'comment',
          'New message from requester',
          `${request.originatorName} sent a message in request ${request.uniqueId}`,
          request._id.toString(),
          request.uniqueId
        );
      }
    }

    res.json({ 
      ok: true, 
      vendorChatMessages: request.vendorChatMessages 
    });
  } catch (err) {
    console.error('Error sending vendor chat message:', err);
    res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
});

export const vendorRouter = router;
