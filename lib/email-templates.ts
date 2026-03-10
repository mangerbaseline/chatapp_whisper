export const getWelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; }
    h1 { color: #0f172a; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Chat App!</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thanks for joining! We're thrilled to have you on board.</p>
      <p>Get started by setting up your profile and exploring all the features we have to offer.</p>
      <center>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
      </center>
      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you have any questions, feel free to reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordResetEmailTemplate = (name: string, otp: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .otp-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 6px; }
    h1 { color: #0f172a; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Use the OTP below to proceed. This OTP will expire in 10 minutes.</p>
      <div class="otp-box">${otp}</div>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPlanBoughtEmailTemplate = (
  name: string,
  planName: string,
  tokens: number,
  amount: number,
  currency: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    h1 { color: #166534; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Purchase Successful!</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Thank you for your purchase. Your payment was successful and your tokens have been added to your account.</p>
      <div class="details">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Tokens Added:</strong> ${tokens}</p>
        <p><strong>Amount Paid:</strong> ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>
      </div>
      <p>Enjoy your new tokens!</p>
    </div>
  </div>
</body>
</html>
`;

export const getRefundRequestEmailTemplate = (
  name: string,
  planName: string,
  reason: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fffbeb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    h1 { color: #b45309; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Request Received</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>We've received your refund request for the <strong>${planName}</strong> plan.</p>
      <p>Our team will review your request based on the reason provided:</p>
      <div class="details">
        <p><em>"${reason}"</em></p>
      </div>
      <p>We will notify you once a decision has been made. This process typically takes 1-2 business days.</p>
    </div>
  </div>
</body>
</html>
`;

export const getRefundInitiatedEmailTemplate = (
  name: string,
  planName: string,
  amount: number,
  currency: string,
  adminNote?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #eff6ff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .amount { font-size: 24px; font-weight: bold; color: #1d4ed8; text-align: center; margin: 20px 0; }
    .note { background-color: #f8fafc; padding: 15px; border-radius: 6px; font-style: italic; font-size: 14px; margin-top: 15px; }
    h1 { color: #1e3a8a; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Approved</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Good news! Your refund request for the <strong>${planName}</strong> plan has bene approved and the refund has been initiated.</p>
      <div class="amount">
        ${amount.toFixed(2)} ${currency.toUpperCase()}
      </div>
      <p>Please note that it may take 5-10 business days for the funds to appear back on your original payment method, depending on your bank.</p>
      ${adminNote ? `<div class="note"><strong>Note from Admin:</strong> ${adminNote}</div>` : ""}
    </div>
  </div>
</body>
</html>
`;

export const getRefundRejectedEmailTemplate = (
  name: string,
  planName: string,
  adminNote?: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef2f2; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .note { background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0; }
    h1 { color: #991b1b; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Request Update</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>We've reviewed your refund request for the <strong>${planName}</strong> plan.</p>
      <p>Unfortunately, we are unable to process this refund. Your tokens remain in your account.</p>
      ${adminNote ? `<div class="note"><strong>Reason:</strong> ${adminNote}</div>` : ""}
      <p>If you have further questions, please reach out to our support team.</p>
    </div>
  </div>
</body>
</html>
`;

export const getRefundedEmailTemplate = (name: string, planName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    h1 { color: #166534; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Complete</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Your refund for the <strong>${planName}</strong> plan has successfully finished processing and the funds should now be available in your original payment method.</p>
      <p>Thank you for your patience!</p>
    </div>
  </div>
</body>
</html>
`;

export const getTicketCreatedEmailTemplate = (
  name: string,
  ticketId: string,
  subject: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    h1 { color: #0f172a; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Support Ticket Created</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Your support ticket has been created successfully. Our team will review your request and get back to you as soon as possible.</p>
      <div class="details">
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <p>Thank you for reaching out to us!</p>
    </div>
  </div>
</body>
</html>
`;

export const getTicketClosedEmailTemplate = (
  name: string,
  ticketId: string,
  subject: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .details { background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    h1 { color: #166534; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Support Ticket Closed</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Your support ticket has been marked as resolved and closed.</p>
      <div class="details">
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <p>If you have any further questions or if your issue is not fully resolved, please open a new ticket or reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const getPasswordResetSuccessEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    h1 { color: #166534; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Successful</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Your password has been successfully reset. You can now log in to your account with your new password.</p>
      <p>If you did not perform this action, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
`;
