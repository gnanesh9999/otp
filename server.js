const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let generatedOtp = null;
let phoneNumber = null;

// Serve the index.html page when visiting root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the dashboard.html page when the OTP is verified
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Route to handle sending the OTP (mocking the process for simplicity)
app.post('/send-otp', (req, res) => {
    const { phone } = req.body;

    if (phone) {
        // Generate a 6-digit OTP (for simulation)
        generatedOtp = crypto.randomInt(100000, 999999).toString();
        phoneNumber = phone; // Store the phone number for later verification

        console.log(`OTP sent to ${phone}: ${generatedOtp}`); // Simulating sending OTP via SMS

        return res.json({ success: true });
    }

    res.status(400).json({ success: false, message: 'Phone number is required' });
});

// Route to verify the OTP entered by the user
app.post('/verify-otp', (req, res) => {
    const { otp } = req.body;

    if (otp && otp === generatedOtp) {
        return res.json({ success: true });
    }

    return res.json({ success: false, message: 'Invalid OTP' });
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
