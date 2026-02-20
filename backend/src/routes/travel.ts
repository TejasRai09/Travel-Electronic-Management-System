
import { Router } from 'express';
import { TravelRequest, Employee, ApprovalChainItem } from '../models.js';
import { verifyToken, type AuthenticatedRequest } from '../jwt.js';
import { createNotification } from './notifications.js';
import { logActivity } from '../activityLogger.js';

const router = Router();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the approval chain based on hierarchical manager structure and impact levels.
 * Goes up the management chain until reaching a manager with impact level 3A, 3B, or 3C.
 * @param requesterEmail - Email of the employee who created the request
 * @returns Array of managers in approval order
 */
async function buildApprovalChain(requesterEmail: string): Promise<ApprovalChainItem[]> {
  const approvalChain: ApprovalChainItem[] = [];
  const visitedEmails = new Set<string>(); // Prevent infinite loops
  
  // Find the requester
  const requester = await Employee.findOne({ email: requesterEmail.toLowerCase().trim() });
  if (!requester || !requester.managerEmail) {
    console.log('No manager found for requester:', requesterEmail);
    return approvalChain;
  }
  
  let currentManagerEmail = requester.managerEmail.toLowerCase().trim();
  
  // Keep going up the chain until we find a manager at 3A/3B/3C level
  while (currentManagerEmail && !visitedEmails.has(currentManagerEmail)) {
    visitedEmails.add(currentManagerEmail);
    
    const manager = await Employee.findOne({ email: currentManagerEmail });
    if (!manager) {
      console.log('Manager not found in Employee collection:', currentManagerEmail);
      break;
    }
    
    // Add this manager to the approval chain
    approvalChain.push({
      email: manager.email,
      name: manager.employeeName,
      impactLevel: manager.impactLevel || 'Unknown',
      employeeNumber: manager.employeeNumber,
      approved: false
    });
    
    // Check if this manager has reached the final approval level (3A, 3B, or 3C)
    const impactLevel = (manager.impactLevel || '').toUpperCase().trim();
    if (impactLevel === '3A' || impactLevel === '3B' || impactLevel === '3C') {
      console.log(`Reached final approval level: ${impactLevel} for ${manager.employeeName}`);
      break; // Stop here - this is the final manager before POC
    }
    
    // Move to the next manager up the chain
    if (manager.managerEmail) {
      currentManagerEmail = manager.managerEmail.toLowerCase().trim();
    } else {
      console.log('No higher manager found for:', manager.employeeName);
      break;
    }
    
    // Safety check: max 10 levels
    if (approvalChain.length >= 10) {
      console.warn('Approval chain exceeded 10 levels - stopping to prevent infinite loop');
      break;
    }
  }
  
  console.log(`Built approval chain with ${approvalChain.length} manager(s):`, 
    approvalChain.map(m => `${m.name} (${m.impactLevel})`).join(' → '));
  
  return approvalChain;
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

    // Build query based on approval chain
    const query: any = {};
    
    if (statusFilter === 'Pending') {
      // For pending tab: show requests where this manager is the current approver
      query.status = 'Pending';
      query.approvalChain = {
        $elemMatch: {
          email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') }
        }
      };
      // Additional filter: manager must be at currentApprovalIndex and not yet approved
      query.$expr = {
        $and: [
          { $gte: [{ $size: '$approvalChain' }, 1] },
          {
            $eq: [
              { $arrayElemAt: ['$approvalChain.email', '$currentApprovalIndex'] },
              userEmail
            ]
          },
          {
            $eq: [
              { $arrayElemAt: ['$approvalChain.approved', '$currentApprovalIndex'] },
              false
            ]
          }
        ]
      };
    } else if (statusFilter === 'ManagerApproved' || statusFilter === 'Rejected') {
      // For approved/rejected tabs: show requests where this manager has already approved/rejected
      // or is in the approval chain
      query.$or = [
        {
          status: statusFilter,
          approvalChain: {
            $elemMatch: {
              email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') }
            }
          }
        },
        // Fallback: old system (direct subordinates)
        {
          status: statusFilter,
          originatorEmail: { 
            $in: await Employee.find({
              $or: [
                { managerEmail: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') } },
                ...(manager?.employeeNumber ? [{ managerEmployeeNo: manager.employeeNumber }] : [])
              ]
            }).then(subs => subs.map(s => s.email))
          }
        }
      ];
    } else {
      // No filter: show all requests where manager is in approval chain
      query.approvalChain = {
        $elemMatch: {
          email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') }
        }
      };
    }
    
    // Find requests
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
    const pendingQuery: any = {
      status: 'Pending',
      approvalChain: {
        $elemMatch: {
          email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') }
        }
      },
      $expr: {
        $and: [
          { $gte: [{ $size: '$approvalChain' }, 1] },
          {
            $eq: [
              { $arrayElemAt: ['$approvalChain.email', '$currentApprovalIndex'] },
              userEmail
            ]
          },
          {
            $eq: [
              { $arrayElemAt: ['$approvalChain.approved', '$currentApprovalIndex'] },
              false
            ]
          }
        ]
      }
    };
    
    const counts = {
      pending: await TravelRequest.countDocuments(pendingQuery),
      approved: await TravelRequest.countDocuments({ 
        $or: [
          {
            status: 'ManagerApproved',
            approvalChain: {
              $elemMatch: {
                email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') },
                approved: true
              }
            }
          },
          {
            status: 'Approved',
            approvalChain: {
              $elemMatch: {
                email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') },
                approved: true
              }
            }
          }
        ]
      }),
      rejected: await TravelRequest.countDocuments({ 
        status: 'Rejected',
        approvalChain: {
          $elemMatch: {
            email: { $regex: new RegExp(`^${escapeRegExp(userEmail)}$`, 'i') }
          }
        }
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

    // Build the hierarchical approval chain based on impact levels
    const approvalChain = await buildApprovalChain(req.user!.email);

    const newRequest = await TravelRequest.create({
      userId: req.user!.userId,
      uniqueId,
      status: 'Pending',
      originatorEmail: req.user!.email,
      originatorName: employee.employeeName,
      
      // Approval chain
      approvalChain,
      currentApprovalIndex: 0,
      
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
    
    // Create notification for the first manager in the approval chain
    if (approvalChain.length > 0) {
      const firstManager = approvalChain[0];
      await createNotification(
        firstManager.email,
        'request_created',
        'New Travel Request - Awaiting Your Approval',
        `${employee.employeeName} submitted a ${tripNature} travel request to ${resolvedDestination || 'multiple destinations'}. You are ${approvalChain.length > 1 ? 'the first' : 'the'} approver in this chain.`,
        newRequest._id.toString(),
        uniqueId
      );
    } else if (employee.managerEmail) {
      // Fallback to old behavior if no approval chain
      await createNotification(
        employee.managerEmail,
        'request_created',
        'New Travel Request',
        `${employee.employeeName} submitted a ${tripNature} travel request to ${resolvedDestination || 'multiple destinations'}`,
        newRequest._id.toString(),
        uniqueId
      );
    }
    
    // Log the activity
    await logActivity(
      req.user!.email,
      employee.employeeName || req.user!.email,
      'create_travel_request',
      `Created ${tripNature} travel request from ${resolvedOrigin || 'origin'} to ${resolvedDestination || 'destination'} on ${travelDate}`,
      req
    );
    
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
    const actorEmail = req.user!.email.toLowerCase().trim();

    let statusMessage = '';
    
    // Handle rejection
    if (status === 'Rejected') {
      if (request.status === 'ManagerApproved') {
        // POC rejection
        request.status = 'POCRejected';
        request.pocApprovedBy = actorEmail;
        request.pocApprovedAt = new Date();
        statusMessage = `Request was rejected by POC (${actorName}).`;
      } else {
        // Manager rejection (at any level)
        request.status = 'Rejected';
        statusMessage = `Request was rejected by ${actorName}.`;
      }
      
      // Add comment if provided
      if (comment && comment.trim()) {
        statusMessage += ` Comment: "${comment.trim()}"`;
      }
      
      // Add system message
      if (!request.chatMessages) request.chatMessages = [];
      request.chatMessages.push({
        sender: 'system@zuari.com',
        senderName: 'System',
        message: statusMessage,
        timestamp: new Date()
      });
      
      await request.save();
      
      // Notify originator
      await createNotification(
        request.originatorEmail,
        'rejection',
        'Request Rejected',
        statusMessage,
        request._id.toString(),
        request.uniqueId
      );
      
      // Log the rejection activity
      await logActivity(
        actorEmail,
        actorName,
        'reject_travel_request',
        `Rejected travel request ${request.uniqueId} - ${statusMessage}`,
        req
      );
      
      const obj = request.toObject();
      return res.json({ 
        ok: true, 
        request: { 
          ...obj, 
          id: request._id.toString(),
          originator: obj.originatorName || 'Unknown',
          department: 'IT'
        } 
      });
    }
    
    // Handle approval with multi-level chain
    if (status === 'Approved') {
      // Check if this is POC approval (status is already ManagerApproved)
      if (request.status === 'ManagerApproved') {
        // POC approval - final approval
        request.status = 'Approved';
        request.pocApprovedBy = actorEmail;
        request.pocApprovedAt = new Date();
        statusMessage = `Request was approved by POC (${actorName}). Ready for vendor to process.`;
        
        // Add comment if provided
        if (comment && comment.trim()) {
          statusMessage += ` Comment: "${comment.trim()}"`;
        }
        
        // Add system message
        if (!request.chatMessages) request.chatMessages = [];
        request.chatMessages.push({
          sender: 'system@zuari.com',
          senderName: 'System',
          message: statusMessage,
          timestamp: new Date()
        });
        
        await request.save();
        
        // Notify employee (originator)
        await createNotification(
          request.originatorEmail,
          'poc_approved',
          'Request Fully Approved',
          `Your travel request ${request.uniqueId} has been approved by POC and sent to vendor`,
          request._id.toString(),
          request.uniqueId
        );
        
        // Log POC approval activity
        await logActivity(
          actorEmail,
          actorName,
          'poc_approve_request',
          `Approved travel request ${request.uniqueId} as POC (Final Approval) - ${statusMessage}`,
          req
        );
        
        const obj = request.toObject();
        return res.json({ 
          ok: true, 
          request: { 
            ...obj, 
            id: request._id.toString(),
            originator: obj.originatorName || 'Unknown',
            department: 'IT'
          } 
        });
      }
      
      // Manager approval - handle multi-level chain
      if (request.status === 'Pending') {
        const approvalChain = request.approvalChain || [];
        const currentIndex = request.currentApprovalIndex || 0;
        
        // Verify that the current user is the expected approver
        if (currentIndex >= approvalChain.length) {
          return res.status(400).json({ ok: false, error: 'No pending approvals in chain' });
        }
        
        const currentApprover = approvalChain[currentIndex];
        if (currentApprover.email.toLowerCase().trim() !== actorEmail) {
          return res.status(403).json({ 
            ok: false, 
            error: `You are not the current approver. Waiting for ${currentApprover.name} to approve.` 
          });
        }
        
        // Mark this manager as approved
        currentApprover.approved = true;
        currentApprover.approvedAt = new Date();
        
        // Check if there are more managers in the chain
        const nextIndex = currentIndex + 1;
        if (nextIndex < approvalChain.length) {
          // Move to the next manager
          request.currentApprovalIndex = nextIndex;
          const nextApprover = approvalChain[nextIndex];
          
          statusMessage = `Request was approved by ${actorName} (${currentApprover.impactLevel}). Now awaiting approval from ${nextApprover.name} (${nextApprover.impactLevel}).`;
          
          // Add comment if provided
          if (comment && comment.trim()) {
            statusMessage += ` Comment: "${comment.trim()}"`;
          }
          
          // Add system message
          if (!request.chatMessages) request.chatMessages = [];
          request.chatMessages.push({
            sender: 'system@zuari.com',
            senderName: 'System',
            message: statusMessage,
            timestamp: new Date()
          });
          
          await request.save();
          
          // Notify employee (originator) of progress
          await createNotification(
            request.originatorEmail,
            'manager_approved',
            'Manager Approved',
            `Your travel request ${request.uniqueId} was approved by ${actorName} and is now with ${nextApprover.name}`,
            request._id.toString(),
            request.uniqueId
          );
          
          // Notify the next manager
          await createNotification(
            nextApprover.email,
            'request_created',
            'Travel Request - Awaiting Your Approval',
            `${request.originatorName}'s travel request ${request.uniqueId} requires your approval (Level ${nextIndex + 1} of ${approvalChain.length})`,
            request._id.toString(),
            request.uniqueId
          );
          
          // Log manager approval activity (intermediate)
          await logActivity(
            actorEmail,
            actorName,
            'manager_approve_request',
            `Approved travel request ${request.uniqueId} as ${currentApprover.impactLevel} manager (Level ${currentIndex + 1}/${approvalChain.length}) - Forwarded to ${nextApprover.name}`,
            req
          );
        } else {
          // All managers in chain have approved - move to POC
          request.status = 'ManagerApproved';
          request.managerApprovedBy = actorEmail;
          request.managerApprovedAt = new Date();
          
          statusMessage = `Request was approved by ${actorName} (${currentApprover.impactLevel}). All manager approvals complete. Awaiting POC final approval.`;
          
          // Add comment if provided
          if (comment && comment.trim()) {
            statusMessage += ` Comment: "${comment.trim()}"`;
          }
          
          // Add system message
          if (!request.chatMessages) request.chatMessages = [];
          request.chatMessages.push({
            sender: 'system@zuari.com',
            senderName: 'System',
            message: statusMessage,
            timestamp: new Date()
          });
          
          await request.save();
          
          // Notify employee (originator)
          await createNotification(
            request.originatorEmail,
            'manager_approved',
            'Manager Approved',
            `Your travel request ${request.uniqueId} was approved by all managers and is now with Travel POC`,
            request._id.toString(),
            request.uniqueId
          );
          
          // Log final manager approval activity
          await logActivity(
            actorEmail,
            actorName,
            'manager_approve_request',
            `Approved travel request ${request.uniqueId} as final ${currentApprover.impactLevel} manager - All manager approvals complete, sent to POC`,
            req
          );
        }
      }
    }

    const obj = request.toObject();
    return res.json({ 
      ok: true, 
      request: { 
        ...obj, 
        id: request._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT'
      } 
    });
  } catch (err) {
      console.error('Error updating status:', err);
      res.status(500).json({ ok: false, error: 'Failed to update status' });
  }
});

export const travelRouter = router;
