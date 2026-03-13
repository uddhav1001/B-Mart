const nodemailer = require('nodemailer');

// Email helper with Gmail and dynamic test account support
let transporterPromise = (async () => {
    // Priority 1: Check for EMAIL_USER/PASS or SMTP_USER/PASS in .env
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

    if (user && pass) {
        return nodemailer.createTransport({
            service: 'gmail', // Optimization for Gmail
            auth: {
                user: user,
                pass: pass
            }
        });
    }

    // Fallback: Create dynamic ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    console.log('--- Created Fresh Ethereal Email Account ---');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
    console.log('--------------------------------------------');

    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
})();

/**
 * Sends the invoice PDF as an email attachment
 * @param {string} toEmail - Customer's email address
 * @param {Buffer} pdfBuffer - The generated PDF buffer
 * @param {string} orderId - The Order ID
 */
const sendInvoiceEmail = async (toEmail, pdfBuffer, orderId) => {
    try {
        const mailOptions = {
            from: '"B-Mart Express" <noreply@bmart.com>',
            to: toEmail,
            subject: `B-Mart Order Confirmation & Invoice - ${orderId}`,
            text: `Hi there,\n\nThank you for shopping with B-Mart!\n\nYour order ${orderId} has been confirmed. Please find your detailed tax invoice attached as a PDF.\n\nBest regards,\nThe B-Mart Team`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <br/>
                    <h2>Thank you for shopping with B-Mart! 🛒</h2>
                    <p>Hi there,</p>
                    <p>Your order <strong>${orderId}</strong> has been successfully confirmed and is being processed.</p>
                    <p>Please find your detailed tax invoice attached to this email as a PDF document.</p>
                    <br/>
                    <p>Best regards,<br/><strong>The B-Mart Team</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice_${orderId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const transporter = await transporterPromise;
        const info = await transporter.sendMail(mailOptions);
        console.log('Invoice email sent successfully. Message ID:', info.messageId);

        // If using Ethereal, log the preview URL:
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;
    } catch (error) {
        console.error("Error sending invoice email:", error);
        throw error;
    }
};

module.exports = { sendInvoiceEmail };
