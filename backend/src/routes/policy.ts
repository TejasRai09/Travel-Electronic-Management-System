import { Router, Request, Response } from 'express';
import { TravelPolicy, TravelPolicyDoc, ImpactLevelPolicy, CityGroup } from '../models.js';
import { verifyToken } from '../jwt.js';
import { logActivity } from '../activityLogger.js';

const router = Router();

// Get active travel policy
router.get('/active', async (req, res) => {
  try {
    const policy = await TravelPolicy.findOne({ isActive: true }).sort({ effectiveFrom: -1 });
    
    if (!policy) {
      return res.json({ ok: false, error: 'No active travel policy found' });
    }
    
    res.json({ ok: true, policy });
  } catch (err: any) {
    console.error('Error fetching active policy:', err);
    res.json({ ok: false, error: err.message || 'Failed to fetch travel policy' });
  }
});

// Get all policies (admin only)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.isAdmin) {
      return res.json({ ok: false, error: 'Admin access required' });
    }
    
    const policies = await TravelPolicy.find().sort({ effectiveFrom: -1, createdAt: -1 });
    
    res.json({ ok: true, policies });
  } catch (err: any) {
    console.error('Error fetching policies:', err);
    res.json({ ok: false, error: err.message || 'Failed to fetch policies' });
  }
});

// Get policy by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.isAdmin) {
      return res.json({ ok: false, error: 'Admin access required' });
    }
    
    const policy = await TravelPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.json({ ok: false, error: 'Policy not found' });
    }
    
    res.json({ ok: true, policy });
  } catch (err: any) {
    console.error('Error fetching policy:', err);
    res.json({ ok: false, error: err.message || 'Failed to fetch policy' });
  }
});

// Create new travel policy (admin only)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.isAdmin) {
      return res.json({ ok: false, error: 'Admin access required' });
    }
    
    const {
      policyName,
      policyVersion,
      impactLevels,
      cityGroups,
      policyRules,
      isActive,
      effectiveFrom
    } = req.body;
    
    // Validation
    if (!policyName || !policyVersion) {
      return res.json({ ok: false, error: 'Policy name and version are required' });
    }
    
    if (!impactLevels || impactLevels.length === 0) {
      return res.json({ ok: false, error: 'At least one impact level is required' });
    }
    
    if (!cityGroups || cityGroups.length === 0) {
      return res.json({ ok: false, error: 'City groups are required' });
    }
    
    // If setting as active, deactivate other policies
    if (isActive) {
      await TravelPolicy.updateMany({ isActive: true }, { $set: { isActive: false } });
    }
    
    const policy = new TravelPolicy({
      policyName,
      policyVersion,
      impactLevels,
      cityGroups,
      policyRules: policyRules || {},
      isActive: isActive !== undefined ? isActive : true,
      effectiveFrom: effectiveFrom || new Date(),
      createdBy: user.email,
      updatedBy: user.email,
    });
    
    await policy.save();
    
    // Log activity
    await logActivity(
      user.email,
      user.profile?.fullName || user.email,
      'create_travel_policy',
      `Created travel policy: ${policyName} (v${policyVersion})`,
      req
    );
    
    res.json({ ok: true, policy });
  } catch (err: any) {
    console.error('Error creating policy:', err);
    res.json({ ok: false, error: err.message || 'Failed to create travel policy' });
  }
});

// Update travel policy (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.isAdmin) {
      return res.json({ ok: false, error: 'Admin access required' });
    }
    
    const {
      policyName,
      policyVersion,
      impactLevels,
      cityGroups,
      policyRules,
      isActive,
      effectiveFrom
    } = req.body;
    
    const policy = await TravelPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.json({ ok: false, error: 'Policy not found' });
    }
    
    // If setting as active, deactivate other policies
    if (isActive && !policy.isActive) {
      await TravelPolicy.updateMany(
        { _id: { $ne: req.params.id }, isActive: true },
        { $set: { isActive: false } }
      );
    }
    
    // Update fields
    if (policyName) policy.policyName = policyName;
    if (policyVersion) policy.policyVersion = policyVersion;
    if (impactLevels) policy.impactLevels = impactLevels;
    if (cityGroups) policy.cityGroups = cityGroups;
    if (policyRules) policy.policyRules = policyRules;
    if (isActive !== undefined) policy.isActive = isActive;
    if (effectiveFrom) policy.effectiveFrom = new Date(effectiveFrom);
    policy.updatedBy = user.email;
    
    await policy.save();
    
    // Log activity
    await logActivity(
      user.email,
      user.profile?.fullName || user.email,
      'update_travel_policy',
      `Updated travel policy: ${policy.policyName} (v${policy.policyVersion})`,
      req
    );
    
    res.json({ ok: true, policy });
  } catch (err: any) {
    console.error('Error updating policy:', err);
    res.json({ ok: false, error: err.message || 'Failed to update travel policy' });
  }
});

// Delete travel policy (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user.isAdmin) {
      return res.json({ ok: false, error: 'Admin access required' });
    }
    
    const policy = await TravelPolicy.findById(req.params.id);
    
    if (!policy) {
      return res.json({ ok: false, error: 'Policy not found' });
    }
    
    if (policy.isActive) {
      return res.json({ ok: false, error: 'Cannot delete active policy. Please make another policy active first.' });
    }
    
    const policyName = policy.policyName;
    const policyVersion = policy.policyVersion;
    
    await TravelPolicy.findByIdAndDelete(req.params.id);
    
    // Log activity
    await logActivity(
      user.email,
      user.profile?.fullName || user.email,
      'delete_travel_policy',
      `Deleted travel policy: ${policyName} (v${policyVersion})`,
      req
    );
    
    res.json({ ok: true, message: 'Policy deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting policy:', err);
    res.json({ ok: false, error: err.message || 'Failed to delete travel policy' });
  }
});

// Validate travel request against policy
router.post('/validate-request', verifyToken, async (req, res) => {
  try {
    const { impactLevel, travelMode, cityGroup } = req.body;
    
    const policy = await TravelPolicy.findOne({ isActive: true }).sort({ effectiveFrom: -1 });
    
    if (!policy) {
      return res.json({ ok: false, error: 'No active travel policy found' });
    }
    
    // Find impact level policy
    const levelPolicy = policy.impactLevels.find((il: ImpactLevelPolicy) => il.level === impactLevel);
    
    if (!levelPolicy) {
      return res.json({ 
        ok: false, 
        error: `Impact level ${impactLevel} not found in policy`,
        valid: false
      });
    }
    
    // Validate travel mode
    let modeAllowed = false;
    let reasonMsg = '';
    
    if (travelMode === 'Air') {
      modeAllowed = levelPolicy.travelMode.airTravel.allowed;
      reasonMsg = modeAllowed 
        ? `Allowed air classes: ${levelPolicy.travelMode.airTravel.classes.join(', ')}`
        : 'Air travel is not allowed for your impact level';
    } else if (travelMode === 'Train') {
      modeAllowed = levelPolicy.travelMode.trainTravel.allowed;
      reasonMsg = modeAllowed 
        ? `Allowed train classes: ${levelPolicy.travelMode.trainTravel.classes.join(', ')}`
        : 'Train travel is not allowed for your impact level';
    } else if (travelMode === 'Bus') {
      modeAllowed = levelPolicy.travelMode.publicTransport.allowed;
      reasonMsg = modeAllowed 
        ? `Allowed: ${levelPolicy.travelMode.publicTransport.types.join(', ')}`
        : 'Public transport is not allowed for your impact level';
    }
    
    // Get city group info
    const cityGroupInfo = policy.cityGroups.find((cg: CityGroup) => cg.name === cityGroup);
    
    res.json({ 
      ok: true, 
      valid: modeAllowed,
      reason: reasonMsg,
      levelPolicy,
      cityGroupInfo,
      policyRules: policy.policyRules
    });
  } catch (err: any) {
    console.error('Error validating request:', err);
    res.json({ ok: false, error: err.message || 'Failed to validate request' });
  }
});

export default router;
