const nodemailer = require('nodemailer');
const env = require('../config/env');
const dns = require('dns');

// Force IPv4 lookup for mail domains to avoid ENETUNREACH errors on networks without IPv6
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname && (hostname.includes('gmail') || hostname.includes('google') || hostname.includes('smtp'))) {
    if (typeof options === 'number') {
      options = 4;
    } else if (typeof options === 'object') {
      options = { ...options, family: 4 };
    } else {
      options = { family: 4 };
    }
  }
  return originalLookup.call(dns, hostname, options, callback);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  connectionTimeout: 3000, // 3 seconds timeout
  greetingTimeout: 3000,
  socketTimeout: 3000,
  auth: {
    type: 'OAuth2',
    user: env.GOOGLE_USER_EMAIL,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN
  }
});


if (process.env.RENDER === 'true') {
  console.log('Running on Render: Outbound SMTP ports (25, 465, 587) are blocked on Render\'s Free tier. The application will use MOCK mode for email sending. You can view generated OTP codes directly in these logs.');
} else {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Error connecting to email server (pre-check):', error.message);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
}

const sendEmail = async (to, subject, text, html) => {
  // Extract OTP code from the HTML template if present
  const otpMatch = html ? html.match(/<p class="otp">(\d+)<\/p>/) : null;
  const extractedOtp = otpMatch ? otpMatch[1] : 'N/A';

  console.log('\n==================================================');
  console.log(`[EMAIL SENDING INITIATED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`OTP Code (Logged Instantly): ${extractedOtp}`);
  console.log('==================================================\n');

  try {
    const info = await transporter.sendMail({
      from: `"India Trade Overseas Testing Mail" <${env.GOOGLE_USER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email via SMTP:', error.message);

    // Return a mock response so the registration/login flow does not fail
    return { messageId: 'mock-message-id-' + Date.now() };
  }
};

module.exports = {
  transporter,
  sendEmail
};
