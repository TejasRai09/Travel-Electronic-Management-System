import express from 'express';
import { Employee, User, SystemConfig, ActivityLog } from '../models.js';
import { verifyJwt } from '../jwt.js';
import { logActivity } from '../activityLogger.js';
import XLSX from 'xlsx';

export const adminRouter = express.Router();

// Middleware to verify admin
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  let payload: { sub: string; email: string };
  try {
    payload = verifyJwt(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check if user is admin
  User.findOne({ email: payload.email }).then((user: any) => {
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    (req as any).user = { email: payload.email };
    next();
  }).catch(() => {
    return res.status(500).json({ error: 'Server error' });
  });
}

function getBearerToken(req: express.Request): string | null {
  const header = String(req.headers.authorization || '').trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

// Get all employees
adminRouter.get('/employees', requireAdmin, async (_req, res) => {
  try {
    const employees = await Employee.find({}).sort({ employeeName: 1 });
    res.json({ ok: true, employees });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Add new employee
adminRouter.post('/employees', requireAdmin, async (req, res) => {
  try {
    const { employeeNumber, employeeName, designation, email, phone, managerEmail, managerEmployeeNo, managerEmployeeName, impactLevel } = req.body;
    
    if (!employeeNumber || !employeeName || !email) {
      return res.status(400).json({ error: 'Employee number, name, and email are required' });
    }

    // Check if employee already exists
    const existing = await Employee.findOne({ $or: [{ email }, { employeeNumber }] });
    if (existing) {
      return res.status(409).json({ error: 'Employee with this email or employee number already exists' });
    }

    const employee = new Employee({
      employeeNumber,
      employeeName,
      designation: designation || '',
      email: email.toLowerCase().trim(),
      phone: phone || '',
      managerEmail: managerEmail || '',
      managerEmployeeNo: managerEmployeeNo || '',
      managerEmployeeName: managerEmployeeName || '',
      impactLevel: impactLevel || '',
    });

    await employee.save();
    
    // Log the activity
    const userEmail = (req as any).user?.email || 'admin';
    await logActivity(userEmail, userEmail, 'admin_add_employee', `Added employee: ${employeeName} (${employeeNumber})`, req);
    
    res.json({ ok: true, employee });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Update employee
adminRouter.put('/employees/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeNumber, employeeName, designation, email, phone, managerEmail, managerEmployeeNo, managerEmployeeName, impactLevel } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        employeeNumber,
        employeeName,
        designation: designation || '',
        email: email.toLowerCase().trim(),
        phone: phone || '',
        managerEmail: managerEmail || '',
        managerEmployeeNo: managerEmployeeNo || '',
        managerEmployeeName: managerEmployeeName || '',
        impactLevel: impactLevel || '',
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Log the activity
    const userEmail = (req as any).user?.email || 'admin';
    await logActivity(userEmail, userEmail, 'admin_update_employee', `Updated employee: ${employee.employeeName} (${employee.employeeNumber})`, req);

    res.json({ ok: true, employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
adminRouter.delete('/employees/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Log the activity
    const userEmail = (req as any).user?.email || 'admin';
    await logActivity(userEmail, userEmail, 'admin_delete_employee', `Deleted employee: ${employee.employeeName} (${employee.employeeNumber})`, req);

    res.json({ ok: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Download Excel template
adminRouter.get('/employees/template/download', requireAdmin, (_req, res) => {
  try {
    // Create template with headers
    const templateData = [
      {
        'Employee Number': 'EMP001',
        'Employee Name': 'John Doe',
        'Designation': 'Manager',
        'Email': 'john.doe@adventz.com',
        'Phone': '9876543210',
        'Manager Email': 'manager@adventz.com',
        'Manager Employee No': 'MGR001',
        'Manager Name': 'Jane Manager',
        'Impact Level': '3A'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employee_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Bulk upload employees (overwrites existing data)
adminRouter.post('/employees/bulk-upload', requireAdmin, async (req, res) => {
  try {
    const { employees, overwrite } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'No employee data provided' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (overwrite) {
      // Delete all existing employees
      const deleteResult = await Employee.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} existing employees`);
    }

    // Insert or update employees
    for (const emp of employees) {
      if (!emp.email || !emp.employeeNumber || !emp.employeeName) {
        skippedCount++;
        continue;
      }

      const existing = await Employee.findOne({ 
        $or: [{ email: emp.email }, { employeeNumber: emp.employeeNumber }] 
      });

      if (existing) {
        await Employee.findByIdAndUpdate(existing._id, {
          employeeNumber: emp.employeeNumber,
          employeeName: emp.employeeName,
          designation: emp.designation || '',
          email: emp.email.toLowerCase().trim(),
          phone: emp.phone || '',
          managerEmail: emp.managerEmail || '',
          managerEmployeeNo: emp.managerEmployeeNo || '',
          managerEmployeeName: emp.managerEmployeeName || '',
          impactLevel: emp.impactLevel || '',
        });
        updatedCount++;
      } else {
        const newEmployee = new Employee({
          employeeNumber: emp.employeeNumber,
          employeeName: emp.employeeName,
          designation: emp.designation || '',
          email: emp.email.toLowerCase().trim(),
          phone: emp.phone || '',
          managerEmail: emp.managerEmail || '',
          managerEmployeeNo: emp.managerEmployeeNo || '',
          managerEmployeeName: emp.managerEmployeeName || '',
          impactLevel: emp.impactLevel || '',
        });
        await newEmployee.save();
        addedCount++;
      }
    }
    
    // Log the activity
    const userEmail = (req as any).user?.email || 'admin';
    await logActivity(userEmail, userEmail, 'admin_bulk_upload', `Bulk uploaded employees: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped (${employees.length} total)`, req);

    res.json({
      ok: true,
      message: 'Bulk upload completed',
      stats: {
        added: addedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: employees.length
      }
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Failed to upload employees' });
  }
});

// Get system configuration
adminRouter.get('/config/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const config = await SystemConfig.findOne({ configKey: key });
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ ok: true, config });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update system configuration
adminRouter.put('/config/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { configValue, description } = req.body;
    const adminEmail = (req as any).user.email;

    const config = await SystemConfig.findOneAndUpdate(
      { configKey: key },
      {
        configKey: key,
        configValue,
        description: description || '',
        updatedBy: adminEmail,
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, config });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get all system configurations
adminRouter.get('/config', requireAdmin, async (_req, res) => {
  try {
    const configs = await SystemConfig.find({});
    res.json({ ok: true, configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get all users (for user management)
adminRouter.get('/users', requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ email: 1 });
    res.json({ ok: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user roles
adminRouter.put('/users/:id/roles', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPOC, isVendor, isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isPOC, isVendor, isAdmin },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Log the activity
    const userEmail = (req as any).user?.email || 'admin';
    const roles = [];
    if (isPOC) roles.push('POC');
    if (isVendor) roles.push('Vendor');
    if (isAdmin) roles.push('Admin');
    const rolesStr = roles.length > 0 ? roles.join(', ') : 'Regular User';
    await logActivity(userEmail, userEmail, 'admin_update_user_roles', `Updated roles for ${user.email}: ${rolesStr}`, req);

    res.json({ ok: true, user });
  } catch (error) {
    console.error('Error updating user roles:', error);
    res.status(500).json({ error: 'Failed to update user roles' });
  }
});

// Get system stats
adminRouter.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [employeeCount, userCount, pocCount, vendorCount, adminCount] = await Promise.all([
      Employee.countDocuments({}),
      User.countDocuments({}),
      User.countDocuments({ isPOC: true }),
      User.countDocuments({ isVendor: true }),
      User.countDocuments({ isAdmin: true }),
    ]);

    res.json({
      ok: true,
      stats: {
        employees: employeeCount,
        users: userCount,
        pocs: pocCount,
        vendors: vendorCount,
        admins: adminCount,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get activity logs
adminRouter.get('/activity-logs', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const userEmail = req.query.userEmail as string;

    const filter: any = {};
    if (action) filter.action = action;
    if (userEmail) filter.userEmail = userEmail;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get activity log statistics
adminRouter.get('/activity-stats', requireAdmin, async (_req, res) => {
  try {
    const [totalLogs, uniqueUsers, recentLogs] = await Promise.all([
      ActivityLog.countDocuments({}),
      ActivityLog.distinct('userEmail'),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(10),
    ]);

    // Count by action type
    const actionCounts = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      ok: true,
      stats: {
        totalLogs,
        uniqueUsers: uniqueUsers.length,
        actionCounts,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});
