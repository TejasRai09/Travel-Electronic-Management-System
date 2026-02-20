import crypto from 'crypto';

export function generateOtp6(): string {
  // 000000-999999
  const value = crypto.randomInt(0, 1_000_000);
  return value.toString().padStart(6, '0');
}

export function hashOtp(otp: string): string {
  // HMAC so OTP isn't stored in plaintext
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
}

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

export function secondsFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
