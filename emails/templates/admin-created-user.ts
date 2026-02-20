type AdminCreatedUserEmailProps = {
  firstName: string;
  baseUrl: string;
  email: string;
  password: string;
};

export const adminCreatedUserEmail = ({
  firstName,
  email,
  password,
  baseUrl,
}: AdminCreatedUserEmailProps) => {
  return {
    subject: "Your account has been created",
    text: `
Welcome to Our Platform 🎉

Hi ${firstName},

An administrator has created an account for you on Our Platform.

Email: ${email}
Password: ${password}

Login here:
${baseUrl}/login

For security reasons, please change your password after your first login.

Best regards,
The Our Platform Team
`.trim(),

    html: `
<!DOCTYPE html>
<html>
  <body style="background:#f5f7fa;padding:24px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;padding:32px;">
      <h2>Welcome to Our Platform</h2>
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>An administrator has created an account for you.</p>
      <p>Email: ${email}</p>
      <p>Password: ${password}</p>

      <p style="margin:32px 0;">
        <a href="${baseUrl}/auth/sign-in"
          style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Log in to your account
        </a>
      </p>

      <p style="color:#6b7280;font-size:14px;">
        Please change your password after your first login.
      </p>

      <p>— The Our Platform Team</p>
    </div>
  </body>
</html>
`.trim(),
  };
};
