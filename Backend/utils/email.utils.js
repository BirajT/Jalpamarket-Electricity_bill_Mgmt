export const registerSuccessEmail = () => {
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #4CAF50; font-size: 24px; text-align: center;">Account Created Successfully!</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #555; text-align: center;">
        Congratulations! Your account has been successfully created. You can now log in and start using our services.
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #555; text-align: center;">
        Click the button below to log in to your account:
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${process.env.FRONT_END_URL}/auth/login" style="background-color: #4CAF50; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; text-transform: uppercase;">Go to Login</a>
      </div>

      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
        If you did not create this account, please ignore this email or contact our support team.
      </p>
    </div>
  </div>
  `;

  return html;
};

export const resetPasswordEmail = (resetUrl) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #fdf6f9; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);">
      <h2 style="color: #e91e8c; font-size: 22px; text-align: center;">Reset Your Password</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #555; text-align: center;">
        We received a request to reset your Jalpa account password. Click the button below to choose a new password.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #e91e8c; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 15px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #888; text-align: center;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    </div>
  </div>
  `;
};