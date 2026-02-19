import bcrypt from 'bcryptjs';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { sendOtpEmail } from '../email.js';
import { Employee, PendingSignup, PasswordReset, User } from '../models.js';
import { hashOtp, generateOtp6, minutesFromNow, secondsFromNow } from '../otp.js';
import { signJwt, verifyJwt } from '../jwt.js';

export const authRouter = express.Router();

// Rate limiters for auth endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30);

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ok(res: express.Response, body: unknown) {
  res.json(body);
}

function bad(res: express.Response, message: string, status = 400) {
  res.status(status).json({ error: message });
}

function getBearerToken(req: express.Request): string | null {
  const header = String(req.headers.authorization || '').trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

// 1) Signup: request OTP (stores pending signup)
authRouter.post('/signup/request-otp', otpLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!email || !isValidEmail(email)) return bad(res, 'Please enter a valid email.');
  if (!email.endsWith('@adventz.com')) return bad(res, 'Please use your corporate @adventz.com email.');
  if (!password || password.length < 6) return bad(res, 'Password must be at least 6 characters.');
  if (password !== confirmPassword) return bad(res, 'Passwords do not match.');

  const employee = await Employee.findOne({ email });
  if (!employee) return bad(res, 'Employee not found in master data. Please contact admin.', 404);

  const existing = await User.findOne({ email });
  if (existing) return bad(res, 'Account already exists. Please log in.', 409);

  const now = new Date();
  const pendingExisting = await PendingSignup.findOne({ email });
  if (pendingExisting && pendingExisting.resendAvailableAt > now) {
    return bad(res, `Please wait a few seconds before requesting a new OTP.`, 429);
  }

  const otp = generateOtp6();
  const otpHash = hashOtp(otp);
  const passwordHash = await bcrypt.hash(password, 10);

  const otpExpiresAt = minutesFromNow(OTP_TTL_MINUTES);
  const resendAvailableAt = secondsFromNow(OTP_RESEND_COOLDOWN_SECONDS);

  await PendingSignup.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      profile: {},
      otpHash,
      otpExpiresAt,
      resendAvailableAt,
      attempts: 0,
    },
    { upsert: true, new: true }
  );

  await sendOtpEmail({
    to: email,
    otp,
    subject: 'Your signup OTP',
    contextLine: 'Use this code to verify your Travel Desk account signup.',
  });

  return ok(res, { ok: true });
});

// 2.5) Current user profile
authRouter.get('/me', async (req, res) => {
  const token = getBearerToken(req);
  if (!token) return bad(res, 'Missing Authorization header.', 401);

  let payload: { sub: string; email: string };
  try {
    payload = verifyJwt(token);
  } catch {
    return bad(res, 'Invalid token.', 401);
  }

  const employee = await Employee.findOne({ email: payload.email });
  if (!employee) {
    return ok(res, {
      ok: true,
      profile: {
        employeeNumber: '',
        employeeName: '',
        designation: '',
        email: payload.email,
        phone: '',
        managerEmail: '',
        managerEmployeeNo: '',
        managerEmployeeName: '',
        impactLevel: '',
      },
    });
  }

  return ok(res, {
    ok: true,
    profile: {
      employeeNumber: employee.employeeNumber,
      employeeName: employee.employeeName,
      designation: employee.designation,
      email: employee.email,
      phone: employee.phone,
      managerEmail: employee.managerEmail,
      managerEmployeeNo: employee.managerEmployeeNo,
      managerEmployeeName: employee.managerEmployeeName,
      impactLevel: employee.impactLevel,
    },
  });
});

// Get user role information (isPOC, isManager)
authRouter.get('/user-info', async (req, res) => {
  const token = getBearerToken(req);
  if (!token) return bad(res, 'Missing Authorization header.', 401);

  let payload: { sub: string; email: string };
  try {
    payload = verifyJwt(token);
  } catch {
    return bad(res, 'Invalid token.', 401);
  }

  const user = await User.findOne({ email: payload.email });
  const employee = await Employee.findOne({ email: payload.email });

  // Check if this employee is a manager by seeing if anyone reports to them
  let isManager = false;
  if (employee) {
    const subordinates = await Employee.countDocuments({ managerEmail: employee.email });
    isManager = subordinates > 0;
  }

  return ok(res, {
    ok: true,
    user: {
      email: payload.email,
      isPOC: user?.isPOC || false,
      isManager: isManager,
      isVendor: user?.isVendor || false,
    },
  });
});

// 2) Signup: verify OTP -> create account
authRouter.post('/signup/verify-otp', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();

  if (!email || !isValidEmail(email)) return bad(res, 'Invalid email.');
  if (!otp || otp.length !== 6) return bad(res, 'OTP must be 6 digits.');

  const pending = await PendingSignup.findOne({ email });
  if (!pending) return bad(res, 'No pending signup found. Please request OTP again.', 404);

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    await PendingSignup.deleteOne({ email });
    return bad(res, 'OTP expired. Please request a new one.', 410);
  }

  const otpHash = hashOtp(otp);
  if (otpHash !== pending.otpHash) {
    pending.attempts += 1;
    await pending.save();
    return bad(res, 'Invalid OTP.', 401);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    await PendingSignup.deleteOne({ email });
    return bad(res, 'Account already exists. Please log in.', 409);
  }

  const created = await User.create({
    email,
    passwordHash: pending.passwordHash,
    verified: true,
    profile: pending.profile,
  });

  await PendingSignup.deleteOne({ email });

  const token = signJwt({ sub: String(created._id), email });
  return ok(res, { ok: true, token });
});

// 3) Login
authRouter.post('/login', loginLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !isValidEmail(email)) return bad(res, 'Invalid email.');
  if (!password) return bad(res, 'Password is required.');

  const user = await User.findOne({ email });
  if (!user) return bad(res, 'Invalid email or password.', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return bad(res, 'Invalid email or password.', 401);

  const token = signJwt({ sub: String(user._id), email });
  return ok(res, { ok: true, token });
});

// 4) Forgot password: request OTP
authRouter.post('/password/request-otp', otpLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email || !isValidEmail(email)) return bad(res, 'Please enter a valid email.');

  const user = await User.findOne({ email });
  if (!user) {
    // Avoid email enumeration
    return ok(res, { ok: true });
  }

  const now = new Date();
  const existing = await PasswordReset.findOne({ email });
  if (existing && existing.resendAvailableAt > now) {
    return bad(res, 'Please wait a few seconds before requesting a new OTP.', 429);
  }

  const otp = generateOtp6();
  const otpHash = hashOtp(otp);

  const otpExpiresAt = minutesFromNow(OTP_TTL_MINUTES);
  const resendAvailableAt = secondsFromNow(OTP_RESEND_COOLDOWN_SECONDS);

  await PasswordReset.findOneAndUpdate(
    { email },
    { email, otpHash, otpExpiresAt, resendAvailableAt, attempts: 0 },
    { upsert: true, new: true }
  );

  await sendOtpEmail({
    to: email,
    otp,
    subject: 'Your password reset OTP',
    contextLine: 'Use this code to reset your Travel Desk password.',
  });

  return ok(res, { ok: true });
});

// 5) Forgot password: verify OTP + set new password
authRouter.post('/password/verify-otp', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!email || !isValidEmail(email)) return bad(res, 'Invalid email.');
  if (!otp || otp.length !== 6) return bad(res, 'OTP must be 6 digits.');
  if (!newPassword || newPassword.length < 6) return bad(res, 'Password must be at least 6 characters.');

  const reset = await PasswordReset.findOne({ email });
  if (!reset) return bad(res, 'No reset request found. Please request OTP again.', 404);

  if (reset.otpExpiresAt.getTime() < Date.now()) {
    await PasswordReset.deleteOne({ email });
    return bad(res, 'OTP expired. Please request a new one.', 410);
  }

  const otpHash = hashOtp(otp);
  if (otpHash !== reset.otpHash) {
    reset.attempts += 1;
    await reset.save();
    return bad(res, 'Invalid OTP.', 401);
  }

  const user = await User.findOne({ email });
  if (!user) {
    await PasswordReset.deleteOne({ email });
    return ok(res, { ok: true });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await PasswordReset.deleteOne({ email });

  return ok(res, { ok: true });
});
