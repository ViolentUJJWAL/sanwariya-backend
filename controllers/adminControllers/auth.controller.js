const Admin = require("../../models/AdminModel");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../utils/sendMail");

exports.signin = async(req, res) => {
    const { email, password } = req.body;
    try {
        if(!email || !password) {
            return res.status(400).json({error: 'Please fill all fields'});
        }
        const user = await Admin.findOne({email});
        if(!user) {
            return res.status(400).json({error: 'Invalid credentials'});
        }
        if(! await user.comparePassword(password)) {
            return res.status(400).json({error: 'Invalid credentials'});
        }
        const token = await user.generateToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(200).json({token, user});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Server error'});
    }
}

exports.signout = async(req, res) => {
    res.clearCookie('token');
    return res.status(200).json({message: 'Signout successfully'});
}

exports.signup = async(req, res) => {
    const { email, password, phoneNo, name } = req.body;
    try {
        if(!email || !password || !phoneNo || !name) {
            return res.status(400).json({error: 'Please fill all fields'});
        }
        const user = await Admin.findOne({email});
        if(user) {
            return res.status(400).json({error: 'User already exists'});
        }
        await Admin.create({email, password, phoneNo, name});
        return res.status(200).json({message: 'User created successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Server error'});
    }
}

exports.sendOtp = async(req, res) => {
    const { email } = req.body;
    try {
        if(!email) {
            return res.status(400).json({error: 'Please fill all fields'});
        }
        const user = await Admin.findOne({email});
        if(!user) {
            return res.status(400).json({error: 'User not found'});
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const msg = `<h1>Your OTP is ${otp}</h1>`;
        // Send OTP to user email
        const isEmailSend = await sendEmail(email, 'OTP for password reset', msg);
        if(!isEmailSend) {
            return res.status(500).json({error: 'Error in sending email'});
        }
        user.otp = await bcrypt.hash(otp.toString(), 10);
        user.expairyOtp = new Date() + 5 * 60 * 1000; // 5 minutes
        await user.save();
        // Send OTP to user email
        return res.status(200).json({message: 'OTP sent successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Server error'});
    }
}

exports.verifyOtp = async(req, res) => {
    const { email, otp, password } = req.body;
    try {
        if(!email || !otp) {
            return res.status(400).json({error: 'Please fill all fields'});
        }
        const user = await Admin.findOne({email});
        if(!user) {
            return res.status(400).json({error: 'User not found'});
        }
        if(new Date() > user.expairyOtp) {
            return res.status(400).json({error: 'Invalid OTP or OTP expired'});
        }
        if(! await bcrypt.compare(otp, user.otp)) {
            return res.status(400).json({error: 'Invalid OTP or OTP expired'});
        }
        user.password = password;
        await user.save();
        return res.status(200).json({message: 'Password reset successfully'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: 'Server error'});
    }
}