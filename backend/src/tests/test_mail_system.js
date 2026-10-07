const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const user = (process.env.SMTP_USER || '').trim();
const pass = (process.env.SMTP_PASS || '').replace(/[\s"]/g, '').trim();

console.log('--- MAIL SYSTEM DIAGNOSTIC ---');
console.log('Host: smtp.gmail.com:587');
console.log('User:', user);
console.log('Password length:', pass.length);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user, pass },
  tls: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('\n1. Verifying SMTP connection...');
    const verifySuccess = await transporter.verify();
    console.log('✅ SMTP Connection & Authentication Succeeded:', verifySuccess);

    console.log('\n2. Testing email transmission to configured sender account...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to: user,
      subject: 'MediKiosk Mail System Diagnostic Test',
      text: 'This is a test email verifying that MediKiosk SMTP and Nodemailer are functioning properly.'
    });
    console.log('✅ Test email successfully sent!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted recipients:', info.accepted);
  } catch (err) {
    console.error('❌ Mail System Test Failed:');
    console.error('Error Code:', err.code);
    console.error('Error Command:', err.command);
    console.error('Message:', err.message);
  }
}

run();
