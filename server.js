const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Dummy in-memory storage for OTP
let storedOtp = null;
let otpExpirationTime = null;

// Create a Nodemailer transporter using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // For Gmail, you can change it according to your provider
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Route to send OTP
app.post('/send-otp', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).send('Phone number is required');
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  storedOtp = otp;
  otpExpirationTime = Date.now() + 5 * 60 * 1000; // OTP is valid for 5 minutes

  // Send OTP to user's email (you can modify this to send SMS if needed)
  const mailOptions = {
    from: process.env.EMAIL,
    to: phoneNumber, // Assuming the phone number is an email (e.g., for testing)
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending OTP');
    }
    return res.status(200).send('OTP sent successfully');
  });
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { otp } = req.body;

  // Check if OTP is expired
  if (Date.now() > otpExpirationTime) {
    return res.status(400).send('OTP has expired');
  }

  // Check if the OTP is correct
  if (otp === storedOtp) {
    storedOtp = null; // Invalidate OTP after verification
    otpExpirationTime = null; // Reset expiration time
    return res.status(200).send('OTP verified successfully');
  } else {
    return res.status(400).send('Invalid OTP');
  }
});

// Serve a simple HTML page for the OTP interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Authentication</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f0f0f0;
            }
            h1 {
                margin-bottom: 20px;
            }
            input, button {
                padding: 10px;
                margin: 10px;
                font-size: 16px;
                border-radius: 5px;
                border: 1px solid #ccc;
            }
            button {
                background-color: #4caf50;
                color: white;
                cursor: pointer;
            }
            button:hover {
                background-color: #45a049;
            }
        </style>
    </head>
    <body>
        <h1>OTP Authentication</h1>
        <div id="otpForm">
            <input type="text" id="phoneNumber" placeholder="Enter your phone number" />
            <button onclick="sendOtp()">Send OTP</button>
        </div>
        <div id="verifyForm" style="display:none;">
            <input type="text" id="otp" placeholder="Enter OTP" />
            <button onclick="verifyOtp()">Verify OTP</button>
        </div>

        <script>
            async function sendOtp() {
                const phoneNumber = document.getElementById('phoneNumber').value;
                if (!phoneNumber) {
                    alert('Please enter a phone number');
                    return;
                }

                try {
                    const response = await fetch('/send-otp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ phoneNumber }),
                    });

                    if (response.ok) {
                        alert('OTP sent! Check your email for the OTP');
                        document.getElementById('otpForm').style.display = 'none';
                        document.getElementById('verifyForm').style.display = 'block';
                    } else {
                        alert('Error sending OTP');
                    }
                } catch (error) {
                    alert('Error sending OTP');
                }
            }

            async function verifyOtp() {
                const otp = document.getElementById('otp').value;
                if (!otp) {
                    alert('Please enter the OTP');
                    return;
                }

                try {
                    const response = await fetch('/verify-otp', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ otp }),
                    });

                    if (response.ok) {
                        alert('OTP verified successfully');
                    } else {
                        alert('Invalid OTP or OTP expired');
                    }
                } catch (error) {
                    alert('Error verifying OTP');
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
