
import { Router } from 'express';
import { TravelRequest, Employee } from '../models.js';
import { verifyToken, type AuthenticatedRequest } from '../jwt.js';
import { createNotification } from './notifications.js';

const router = Router();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get all requests for the logged-in user
router.get('/', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const rawRequests = await TravelRequest.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    // Map _id to id and originator for frontend compatibility
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT' // Added for compatibility
      };
    });
    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Get requests that need approval (for managers)
router.get('/approvals', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email.trim().toLowerCase();
    const statusFilter = req.query.status as string | undefined;
    
    const manager = await Employee.findOne({
      email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') },
    });

    const subordinateCriteria: Record<string, unknown>[] = [
      { managerEmail: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') } },
    ];

    if (manager?.employeeNumber) {
      subordinateCriteria.push({ managerEmployeeNo: manager.employeeNumber });
    }

    if (manager?.employeeName) {
      subordinateCriteria.push({
        managerEmployeeName: { $regex: new RegExp(`^${escapeRegExp(manager.employeeName)}$`, 'i') },
      });
    }

    // Find employees who report to this manager
    const subordinates = await Employee.find({ $or: subordinateCriteria });
    const subordinateEmails = subordinates.map(emp => emp.email);
    
    // Build query - filter by status if provided
    const query: any = { 
      originatorEmail: { $in: subordinateEmails }
    };
    
    if (statusFilter) {
      // For manager's approved tab, show requests where manager has approved
      // This includes both ManagerApproved and Approved (after POC approval)
      if (statusFilter === 'ManagerApproved') {
        query.$or = [
          { status: 'ManagerApproved' },
          { status: 'Approved', managerApprovedBy: { $exists: true, $ne: null } }
        ];
      } else {
        query.status = statusFilter;
      }
    }
    
    // Find requests from subordinates
    const rawRequests = await TravelRequest.find(query).sort({ createdAt: -1 });
    
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT'
      };
    });
    
    // Get counts by status for dashboard stats
    const counts = {
      pending: await TravelRequest.countDocuments({ 
        originatorEmail: { $in: subordinateEmails },
        status: 'Pending'
      }),
      // Count includes both ManagerApproved and Approved (where manager has approved)
      approved: await TravelRequest.countDocuments({ 
        originatorEmail: { $in: subordinateEmails },
        $or: [
          { status: 'ManagerApproved' },
          { status: 'Approved', managerApprovedBy: { $exists: true, $ne: null } }
        ]
      }),
      rejected: await TravelRequest.countDocuments({ 
        originatorEmail: { $in: subordinateEmails },
        status: 'Rejected'
      })
    };
    
    res.json({ ok: true, requests, counts });
  } catch (err) {
    console.error('Error fetching approval requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Create a new request
router.post('/', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      tripNature, mode, passengerName, passengerPhone, dietaryPreference,
      origin, destination, travelDate, returnDate, departureTimeSlot, travelClass,
      purpose,
      accommodationRequired, hotelPreference, checkInDate, checkOutDate,
      itineraryLegs,
      specialInstructions
    } = req.body;

    const isMultiCity = tripNature === 'Multicity';
    const parsedLegs = Array.isArray(itineraryLegs)
      ? itineraryLegs
          .map((leg) => ({
            origin: String(leg?.origin || '').trim(),
            destination: String(leg?.destination || '').trim(),
            travelDate: String(leg?.travelDate || '').trim(),
            timeSlot: String(leg?.timeSlot || '').trim(),
          }))
          .filter((leg) => leg.origin && leg.destination && leg.travelDate)
      : [];

    if (isMultiCity && parsedLegs.length < 2) {
      return res.status(400).json({ ok: false, error: 'Multi-city trips require at least two legs.' });
    }

    const resolvedOrigin = isMultiCity ? parsedLegs[0]?.origin : origin;
    const resolvedDestination = isMultiCity ? parsedLegs[0]?.destination : destination;
    const resolvedTravelDate = isMultiCity ? parsedLegs[0]?.travelDate : travelDate;
    const resolvedReturnDate = isMultiCity ? undefined : returnDate;
    const resolvedTimeSlot = isMultiCity ? undefined : departureTimeSlot;

    // Get user's employee profile
    const employee = await Employee.findOne({ email: req.user!.email });
    if (!employee) {
      return res.status(400).json({ ok: false, error: 'Employee profile not found' });
    }

    // Generate Unique ID
    const count = await TravelRequest.countDocuments();
    const uniqueId = `TR-${new Date().getFullYear()}-${String(1000 + count + 1).padStart(4, '0')}`;

    const newRequest = await TravelRequest.create({
      userId: req.user!.userId,
      uniqueId,
      status: 'Pending',
      originatorEmail: req.user!.email,
      originatorName: employee.employeeName,
      
      tripNature,
      mode,
      passengerName,
      passengerPhone,
      dietaryPreference,
      
      origin: resolvedOrigin,
      destination: resolvedDestination,
      travelDate: new Date(resolvedTravelDate),
      returnDate: resolvedReturnDate ? new Date(resolvedReturnDate) : undefined,
      departureTimeSlot: resolvedTimeSlot,
      itineraryLegs: isMultiCity
        ? parsedLegs.map((leg) => ({
            origin: leg.origin,
            destination: leg.destination,
            travelDate: new Date(leg.travelDate),
            timeSlot: leg.timeSlot || undefined,
          }))
        : undefined,
      travelClass,
      
      purpose,
      
      accommodationRequired,
      hotelPreference,
      checkInDate: checkInDate ? new Date(checkInDate) : undefined,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      
      specialInstructions,
      
      chatMessages: [{
        sender: 'system@zuari.com',
        senderName: 'Travel Desk System',
        message: 'Your travel request has been submitted and is pending approval.',
        timestamp: new Date()
      }],
      fileAttachments: []
    });

    const obj = newRequest.toObject();
    
    // Create notification for manager
    if (employee.managerEmail) {
      await createNotification(
        employee.managerEmail,
        'request_created',
        'New Travel Request',
        `${employee.employeeName} submitted a ${tripNature} travel request to ${resolvedDestination || 'multiple destinations'}`,
        newRequest._id.toString(),
        uniqueId
      );
    }
    
    res.json({ 
      ok: true, 
      request: { 
        ...obj, 
        id: newRequest._id.toString(),
        originator: obj.originatorName,
        department: 'IT'
      } 
    });
  } catch (err) {
    console.error('Error creating travel request:', err);
    res.status(500).json({ ok: false, error: 'Failed to create request' });
  }
});

// Add a chat message to a request
router.post('/:id/chat', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }
    
    const employee = await Employee.findOne({ email: req.user!.email });
    const senderName = employee?.employeeName || req.user!.email;
    
    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    if (!request.originatorEmail) {
      request.originatorEmail = req.user!.email;
    }

    if (!request.originatorName) {
      request.originatorName = employee?.employeeName || req.user!.email;
    }
    
    if (!request.chatMessages) {
      request.chatMessages = [];
    }

    const chatMessage = {
      sender: req.user!.email,
      senderName,
      message: message.trim(),
      timestamp: new Date()
    };
    
    request.chatMessages.push(chatMessage);
    await request.save();
    
    res.json({ ok: true, message: chatMessage });
  } catch (err) {
    console.error('Error adding chat message:', err);
    const message = err instanceof Error ? err.message : 'Failed to add message';
    res.status(500).json({ ok: false, error: message });
  }
});

// Add a file attachment to a request
router.post('/:id/files', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileUrl } = req.body;
    
    if (!fileName || !fileUrl) {
      return res.status(400).json({ ok: false, error: 'File name and URL are required' });
    }
    
    const employee = await Employee.findOne({ email: req.user!.email });
    const uploaderName = employee?.employeeName || req.user!.email;
    
    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    if (!request.originatorEmail) {
      request.originatorEmail = req.user!.email;
    }

    if (!request.originatorName) {
      request.originatorName = uploaderName;
    }
    
    if (!request.fileAttachments) {
      request.fileAttachments = [];
    }

    const fileAttachment = {
      fileName,
      fileUrl,
      uploadedBy: req.user!.email,
      uploadedByName: uploaderName,
      uploadedAt: new Date()
    };
    
    request.fileAttachments.push(fileAttachment);
    await request.save();
    
    res.json({ ok: true, file: fileAttachment });
  } catch (err) {
    console.error('Error adding file attachment:', err);
    const message = err instanceof Error ? err.message : 'Failed to add file';
    res.status(500).json({ ok: false, error: message });
  }
});

// Get a specific request by ID
router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const request = await TravelRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }
    
    const obj = request.toObject();
    res.json({ 
      ok: true, 
      request: { 
        ...obj, 
        id: request._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT'
      } 
    });
  } catch (err) {
    console.error('Error fetching request:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Update request status (Approve/Reject)
router.patch('/:id/status', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // Expect 'Approved' or 'Rejected', optional comment

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ ok: false, error: 'Invalid status' });
    }

    const request = await TravelRequest.findById(id);
    if (!request) {
        return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    const employee = await Employee.findOne({ email: req.user!.email });
    const actorName = employee?.employeeName || req.user!.email;
    const actorEmail = req.user!.email;

    let statusMessage = '';
    
    // Determine if this is Manager or POC approval based on current status
    if (status === 'Approved') {
      if (request.status === 'ManagerApproved') {
        // POC approval - final approval
        request.status = 'Approved';
        request.pocApprovedBy = actorEmail;
        request.pocApprovedAt = new Date();
        statusMessage = `Request was approved by POC (${actorName}). Ready for vendor to process.`;
      } else if (request.status === 'Pending') {
        // Manager approval - send to POC
        request.status = 'ManagerApproved';
        request.managerApprovedBy = actorEmail;
        request.managerApprovedAt = new Date();
        statusMessage = `Request was approved by manager (${actorName}). Awaiting POC final approval.`;
      }
    } else if (status === 'Rejected') {
      if (request.status === 'ManagerApproved') {
        // POC rejection
        request.status = 'POCRejected';
        request.pocApprovedBy = actorEmail;
        request.pocApprovedAt = new Date();
        statusMessage = `Request was rejected by POC (${actorName}).`;
      } else {
        // Manager rejection
        request.status = 'Rejected';
        statusMessage = `Request was rejected by manager (${actorName}).`;
      }
    }
    
    // Add comment if provided
    if (comment && comment.trim()) {
      statusMessage += ` Comment: "${comment.trim()}"`;
    }
    
    // Add a system message about the status change
    if (!request.chatMessages) request.chatMessages = [];
    request.chatMessages.push({
        sender: 'system@zuari.com',
        senderName: 'System',
        message: statusMessage,
        timestamp: new Date()
    });

    await request.save();
    
    // Create notifications based on status change
    if (status === 'Approved') {
      if (request.status === 'Approved') {
        // POC approved - notify employee (originator)
        await createNotification(
          request.originatorEmail,
          'poc_approved',
          'Request Fully Approved',
          `Your travel request ${request.uniqueId} has been approved by POC and sent to vendor`,
          request._id.toString(),
          request.uniqueId
        );
      } else if (request.status === 'ManagerApproved') {
        // Manager approved - notify employee and POC
        await createNotification(
          request.originatorEmail,
          'manager_approved',
          'Manager Approved',
          `Your travel request ${request.uniqueId} was approved by your manager and is now with POC`,
          request._id.toString(),
          request.uniqueId
        );
        
        // Notify all POCs
        const pocs = await Employee.find({ isPOC: true });
        for (const poc of pocs) {
          if (poc.email) {
            await createNotification(
              poc.email,
              'manager_approved',
              'Request Needs POC Review',
              `Travel request ${request.uniqueId} from ${request.originatorName} needs your approval`,
              request._id.toString(),
              request.uniqueId
            );
          }
        }
      }
    } else if (status === 'Rejected') {
      // Rejection - notify employee
      await createNotification(
        request.originatorEmail,
        'rejection',
        'Request Rejected',
        `Your travel request ${request.uniqueId} was rejected${comment ? `: ${comment}` : ''}`,
        request._id.toString(),
        request.uniqueId
      );
    }

    res.json({ ok: true, status: request.status });
  } catch (err) {
      console.error('Error updating status:', err);
      res.status(500).json({ ok: false, error: 'Failed to update status' });
  }
});

export const travelRouter = router;
