import { Router } from 'express';
import { TravelRequest, Employee, User } from '../models.js';
import { verifyToken, type AuthenticatedRequest } from '../jwt.js';

const router = Router();

// Middleware to verify POC role
async function verifyPOC(req: AuthenticatedRequest, res: any, next: any) {
  try {
    const user = await User.findOne({ email: req.user!.email });
    if (!user?.isPOC) {
      return res.status(403).json({ ok: false, error: 'Access denied. POC role required.' });
    }
    next();
  } catch (err) {
    console.error('Error verifying POC:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}

// Get all manager-approved requests awaiting POC review
router.get('/requests', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const rawRequests = await TravelRequest.find({ 
      status: 'ManagerApproved'
    }).sort({ managerApprovedAt: -1 });
    
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT'
      };
    });
    
    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Error fetching POC requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Get all requests (for POC to view history)
router.get('/all-requests', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const rawRequests = await TravelRequest.find({}).sort({ createdAt: -1 });
    
    const requests = rawRequests.map(req => {
      const obj = req.toObject();
      return {
        ...obj,
        id: req._id.toString(),
        originator: obj.originatorName || 'Unknown',
        department: 'IT'
      };
    });
    
    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Edit a request (POC only)
router.patch('/requests/:id/edit', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    if (request.status !== 'ManagerApproved') {
      return res.status(400).json({ ok: false, error: 'Can only edit manager-approved requests' });
    }

    // Update allowed fields
    const allowedFields = [
      'tripNature', 'mode', 'passengerName', 'passengerPhone', 'dietaryPreference',
      'origin', 'destination', 'travelDate', 'returnDate', 'departureTimeSlot', 
      'travelClass', 'purpose', 'accommodationRequired', 'hotelPreference',
      'checkInDate', 'checkOutDate', 'specialInstructions', 'itineraryLegs'
    ];

    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        (request as any)[field] = updateFields[field];
      }
    });

    request.pocEditedAt = new Date();

    // Add a system message about the edit
    const employee = await Employee.findOne({ email: req.user!.email });
    const pocName = employee?.employeeName || req.user!.email;
    
    if (!request.chatMessages) request.chatMessages = [];
    request.chatMessages.push({
      sender: 'system@zuari.com',
      senderName: 'System',
      message: `Request details were edited by POC (${pocName}).`,
      timestamp: new Date()
    });

    await request.save();

    const obj = request.toObject();
    res.json({ 
      ok: true, 
      request: {
        ...obj,
        id: request._id.toString(),
        originator: obj.originatorName || 'Unknown'
      }
    });
  } catch (err) {
    console.error('Error editing request:', err);
    res.status(500).json({ ok: false, error: 'Failed to edit request' });
  }
});

// POC Final Approval
router.patch('/requests/:id/approve', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    if (request.status !== 'ManagerApproved') {
      return res.status(400).json({ ok: false, error: 'Request must be manager-approved first' });
    }

    const employee = await Employee.findOne({ email: req.user!.email });
    const pocName = employee?.employeeName || req.user!.email;

    request.status = 'Approved';
    request.pocApprovedBy = req.user!.email;
    request.pocApprovedAt = new Date();

    if (!request.chatMessages) request.chatMessages = [];
    request.chatMessages.push({
      sender: 'system@zuari.com',
      senderName: 'System',
      message: `Request received final approval from POC (${pocName}).`,
      timestamp: new Date()
    });

    await request.save();

    res.json({ ok: true, status: request.status });
  } catch (err) {
    console.error('Error approving request:', err);
    res.status(500).json({ ok: false, error: 'Failed to approve request' });
  }
});

// POC Rejection
router.patch('/requests/:id/reject', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await TravelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ ok: false, error: 'Request not found' });
    }

    if (request.status !== 'ManagerApproved') {
      return res.status(400).json({ ok: false, error: 'Request must be manager-approved first' });
    }

    const employee = await Employee.findOne({ email: req.user!.email });
    const pocName = employee?.employeeName || req.user!.email;

    request.status = 'POCRejected';

    if (!request.chatMessages) request.chatMessages = [];
    request.chatMessages.push({
      sender: 'system@zuari.com',
      senderName: 'System',
      message: `Request was rejected by POC (${pocName}). Reason: ${reason || 'No reason provided'}`,
      timestamp: new Date()
    });

    await request.save();

    res.json({ ok: true, status: request.status });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ ok: false, error: 'Failed to reject request' });
  }
});

// Create request on behalf of someone else
router.post('/create-for', verifyToken, verifyPOC, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      onBehalfOfEmail,
      tripNature, mode, passengerName, passengerPhone, dietaryPreference,
      origin, destination, travelDate, returnDate, departureTimeSlot, travelClass,
      purpose,
      accommodationRequired, hotelPreference, checkInDate, checkOutDate,
      itineraryLegs,
      specialInstructions
    } = req.body;

    if (!onBehalfOfEmail) {
      return res.status(400).json({ ok: false, error: 'onBehalfOfEmail is required' });
    }

    // Find the user for whom the request is being created
    const targetUser = await User.findOne({ email: onBehalfOfEmail.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ ok: false, error: 'Target user not found' });
    }

    const targetEmployee = await Employee.findOne({ email: onBehalfOfEmail.toLowerCase().trim() });
    const originatorName = targetEmployee?.employeeName || onBehalfOfEmail;

    const isMultiCity = tripNature === 'Multicity';
    const parsedLegs = Array.isArray(itineraryLegs)
      ? itineraryLegs
          .map((leg) => ({
            origin: String(leg?.origin || '').trim(),
            destination: String(leg?.destination || '').trim(),
            travelDate: leg?.travelDate ? new Date(leg.travelDate) : new Date(),
            timeSlot: leg?.timeSlot ? String(leg.timeSlot).trim() : undefined,
          }))
          .filter(leg => leg.origin && leg.destination)
      : [];

    // Generate uniqueId
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const count = await TravelRequest.countDocuments();
    const uniqueId = `TR-${year}-${String(dayOfYear).padStart(4, '0')}${String(count + 1).padStart(3, '0')}`;

    const newRequest = new TravelRequest({
      userId: targetUser._id,
      uniqueId,
      status: 'ManagerApproved', // Skip manager approval since POC is creating it
      originatorEmail: onBehalfOfEmail.toLowerCase().trim(),
      originatorName,
      
      tripNature,
      mode,
      passengerName,
      passengerPhone,
      dietaryPreference,
      origin,
      destination,
      travelDate: new Date(travelDate),
      returnDate: returnDate ? new Date(returnDate) : undefined,
      departureTimeSlot,
      itineraryLegs: isMultiCity && parsedLegs.length > 0 ? parsedLegs : undefined,
      travelClass,
      purpose,
      accommodationRequired: accommodationRequired || false,
      hotelPreference,
      checkInDate: checkInDate ? new Date(checkInDate) : undefined,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      specialInstructions,
      chatMessages: [{
        sender: 'system@zuari.com',
        senderName: 'System',
        message: `Request created by POC on behalf of ${originatorName}.`,
        timestamp: new Date()
      }],
      fileAttachments: []
    });

    await newRequest.save();

    const obj = newRequest.toObject();
    res.json({
      ok: true,
      request: {
        ...obj,
        id: newRequest._id.toString(),
        originator: originatorName
      },
      message: 'Travel request created successfully on behalf of employee.'
    });
  } catch (err) {
    console.error('Error creating request on behalf:', err);
    res.status(500).json({ ok: false, error: 'Failed to create request' });
  }
});

export const pocRouter = router;
