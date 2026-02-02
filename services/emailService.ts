import { Notification } from '../types';

/**
 * EMAIL SERVICE SIMULATION
 * Frontend simulation for feedback. Real emails should be sent from api/index.ts.
 */

export const emailService = {
  
  sendLoginAlert: async (userEmail: string, tenantId: string) => {
    console.log(`[SMTP] Sending Login Alert to ${userEmail}...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`[SMTP] Email sent to ${userEmail}: "New Login Detected"`);
    return true;
  },

  sendPasswordReset: async (email: string) => {
    console.log(`[SMTP] Sending Password Reset Link to ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`[SMTP] Reset Link: https://zaynahspos.vercel.app/reset-password?token=${btoa(email)}`);
    return true;
  },

  sendWelcomeEmail: async (email: string, name: string) => {
    console.log(`[SMTP] Sending Welcome Email to ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[SMTP] Welcome sent to ${name}`);
    return true;
  },

  sendOrderReceipt: async (email: string, orderId: string, amount: number) => {
    console.log(`[SMTP] Sending Receipt for Order #${orderId} to ${email}`);
    return true;
  }
};