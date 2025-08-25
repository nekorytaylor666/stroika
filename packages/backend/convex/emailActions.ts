import { v } from "convex/values";
import { action } from "./_generated/server";

// Email types
export type EmailType =
	| "password_reset"
	| "welcome"
	| "invite"
	| "password_changed";

// Send password reset email
export const sendPasswordResetEmail = action({
	args: {
		email: v.string(),
		resetToken: v.string(),
		userName: v.string(),
	},
	handler: async (ctx, args) => {
		// TODO: Integrate with your email service (SendGrid, Resend, etc.)
		// For now, we'll just log the email content

		const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${args.resetToken}`;

		const emailContent = {
			to: args.email,
			subject: "Reset Your Password - Stroika",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Password Reset Request</h2>
					<p>Hi ${args.userName},</p>
					<p>We received a request to reset your password. Click the button below to create a new password:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							Reset Password
						</a>
					</div>
					<p>Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all;">${resetUrl}</p>
					<p>This link will expire in 1 hour for security reasons.</p>
					<p>If you didn't request this password reset, you can safely ignore this email.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 14px;">
						This email was sent by Stroika. If you have any questions, please contact support.
					</p>
				</div>
			`,
			text: `
				Password Reset Request
				
				Hi ${args.userName},
				
				We received a request to reset your password. Visit the following link to create a new password:
				
				${resetUrl}
				
				This link will expire in 1 hour for security reasons.
				
				If you didn't request this password reset, you can safely ignore this email.
			`,
		};

		console.log("Sending password reset email:", emailContent);

		// TODO: Replace with actual email service integration
		// Example with Resend:
		// const resend = new Resend(process.env.RESEND_API_KEY);
		// await resend.emails.send(emailContent);

		return { success: true };
	},
});

// Send welcome email with temporary password
export const sendWelcomeEmail = action({
	args: {
		email: v.string(),
		userName: v.string(),
		temporaryPassword: v.string(),
		organizationName: v.string(),
		inviterName: v.string(),
	},
	handler: async (ctx, args) => {
		const loginUrl = `${process.env.APP_URL}/auth/sign-in`;

		const emailContent = {
			to: args.email,
			subject: `Welcome to ${args.organizationName} - Stroika`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Welcome to ${args.organizationName}!</h2>
					<p>Hi ${args.userName},</p>
					<p>${args.inviterName} has created an account for you on Stroika.</p>
					<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p><strong>Your login credentials:</strong></p>
						<p>Email: ${args.email}</p>
						<p>Temporary Password: <code style="background-color: #e5e5e5; padding: 2px 6px; border-radius: 4px;">${args.temporaryPassword}</code></p>
					</div>
					<p><strong>Important:</strong> You will be required to change this password when you first log in.</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							Sign In to Stroika
						</a>
					</div>
					<p>If you have any questions, please don't hesitate to reach out to ${args.inviterName} or your team administrator.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 14px;">
						This email was sent by Stroika on behalf of ${args.organizationName}.
					</p>
				</div>
			`,
			text: `
				Welcome to ${args.organizationName}!
				
				Hi ${args.userName},
				
				${args.inviterName} has created an account for you on Stroika.
				
				Your login credentials:
				Email: ${args.email}
				Temporary Password: ${args.temporaryPassword}
				
				Important: You will be required to change this password when you first log in.
				
				Sign in at: ${loginUrl}
				
				If you have any questions, please don't hesitate to reach out to ${args.inviterName} or your team administrator.
			`,
		};

		console.log("Sending welcome email:", emailContent);

		// TODO: Replace with actual email service integration

		return { success: true };
	},
});

// Send password changed confirmation
export const sendPasswordChangedEmail = action({
	args: {
		email: v.string(),
		userName: v.string(),
	},
	handler: async (ctx, args) => {
		const emailContent = {
			to: args.email,
			subject: "Password Changed Successfully - Stroika",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Password Changed Successfully</h2>
					<p>Hi ${args.userName},</p>
					<p>Your password has been successfully changed.</p>
					<p>If you did not make this change, please contact your administrator immediately and request a password reset.</p>
					<p style="margin-top: 30px;">For security reasons, we recommend:</p>
					<ul>
						<li>Using a unique password that you don't use on other sites</li>
						<li>Enabling two-factor authentication if available</li>
						<li>Keeping your password confidential</li>
					</ul>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 14px;">
						This email was sent by Stroika as a security notification.
					</p>
				</div>
			`,
			text: `
				Password Changed Successfully
				
				Hi ${args.userName},
				
				Your password has been successfully changed.
				
				If you did not make this change, please contact your administrator immediately and request a password reset.
				
				For security reasons, we recommend:
				- Using a unique password that you don't use on other sites
				- Enabling two-factor authentication if available
				- Keeping your password confidential
			`,
		};

		console.log("Sending password changed email:", emailContent);

		// TODO: Replace with actual email service integration

		return { success: true };
	},
});
