import { ActivityLog } from './models.js';
import type { Request } from 'express';

export async function logActivity(
  userEmail: string,
  userName: string,
  action: string,
  details: string,
  req?: Request
) {
  try {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '';
    const userAgent = req?.get('user-agent') || '';

    await ActivityLog.create({
      userEmail,
      userName,
      action,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - logging failure shouldn't break the main flow
  }
}
