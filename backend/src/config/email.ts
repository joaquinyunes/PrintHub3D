import nodemailer from 'nodemailer';
import logger from './logger';

const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  logger.warn('SMTP no configurado. Usando transporte de prueba (emails no enviados realmente).');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'default@ethereal.email',
      pass: 'default',
    },
  });
};

export const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"PrintHub3D" <noreply@printhub3d.com>',
    to: email,
    subject: 'Verifica tu cuenta - PrintHub3D',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${name}!</h2>
        <p>Gracias por registrarte en PrintHub3D. Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verificar mi cuenta
        </a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p><strong>Este enlace expirará en 24 horas.</strong></p>
        <hr style="margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de verificación enviado a ${email}`, { messageId: info.messageId });
  } catch (error) {
    logger.error('Error enviando email de verificación:', error);
    throw new Error('No se pudo enviar el email de verificación');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string): Promise<void> => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || '"PrintHub3D" <noreply@printhub3d.com>',
    to: email,
    subject: 'Recuperar contraseña - PrintHub3D',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${name}!</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Restablecer contraseña
        </a>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p><strong>Este enlace expirará en 1 hora.</strong></p>
        <hr style="margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de recuperación enviado a ${email}`, { messageId: info.messageId });
  } catch (error) {
    logger.error('Error enviando email de recuperación:', error);
    throw new Error('No se pudo enviar el email de recuperación');
  }
};
