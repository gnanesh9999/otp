const express = require('express');
const bodyParser = require('body-parser');
const serialport = require('serialport');
const crypto = require('crypto');
const Readline = require('@serialport/parser-readline');
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());

// GSM modem serial port setup (modify with your own port)
const modemPort = '/dev/ttyUSB0'; // This is for Linux; for Windows, it could be something like 'COM3'
const modem = new serialport(modemPort, { baudRate: 9600 });
const parser = modem.pipe(new Readline({ delimiter: '\r\n' }));

// Generate OTP function
const generateOTP = () => {
    const otp = crypto.randomInt(100000, 999999); // Generates a 6-digit OTP
    return otp;
};

// Send SMS function using AT commands (through GSM Modem)
const sendSMS = (phoneNumber, otp) => {
    modem.write(`AT+CMGF=1\r\n`); // Set SMS to text mode
    modem.write(`AT+CMGS="${phoneNumber}"\r\n`); // Set recipient's phone number
    modem.write(`${otp}\r\n`); // The OTP to send
    modem.write(Buffer.from([0x1A])); // End the message with Ctrl+Z (ASCII code 26)
    console.log(`Sending OTP: ${otp} to ${phoneNumber}`);
};

// Endpoint to initiate OTP generation and sending
app.post('/send-otp', (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    const otp = generateOTP();
    
    // Store OTP temporarily for validation
    // Ideally, store OTP in a database or in-memory store (like Redis) for validation later
    app.locals[phoneNumber] = otp;

    // Send OTP to the user via GSM modem
    sendSMS(phoneNumber, otp);

    return res.status(200).json({ message: 'OTP sent successfully!' });
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const storedOtp = app.locals[phoneNumber];

    if (storedOtp && storedOtp == otp) {
        return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ message: 'Invalid OTP' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
