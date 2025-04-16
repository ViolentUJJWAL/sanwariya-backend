const ContactUs = require('../models/ContactUsModel'); // adjust path as needed
const sendEmail = require('../utils/sendMail'); // adjust path
const mongoose = require('mongoose');

// Utility for catching validation errors
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Send Contact Message
exports.sendContactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Save to DB
    const contact = await ContactUs.create({ name, email, message });

    // 1️⃣ Email to user
    const userSubject = "We've received your message!";
    const userMsg = `
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to us. We’ve received your message and will get back to you soon.</p>
      <p><strong>Your Message:</strong><br/>${message}</p>
      <p>Best Regards,<br/>Support Team</p>
    `;
    await sendEmail(email, userSubject, userMsg);

    // 2️⃣ Email to admin
    const adminSubject = `New Contact Request from ${name}`;
    const adminMsg = `
      <p><strong>New Contact Submission</strong></p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
      <p>Check the dashboard to respond.</p>
    `;
    await sendEmail(process.env.ADMIN_EMAIL, adminSubject, adminMsg);

    res.status(201).json({ success: true, message: "Message sent successfully", data: contact });
  } catch (err) {
    console.error("Send Contact Error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Get All Contacts with filters, search, pagination
exports.getAllContactUs = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = '', status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    const allowedStatuses = ['pending', 'respond'];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await ContactUs.countDocuments(query);
    const contacts = await ContactUs.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get All Contacts Error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Get Single Contact by ID
exports.getContactUsByID = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const contact = await ContactUs.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    console.error("Get Contact By ID Error:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Respond to Contact (Send email + update DB)
exports.respondToContactUs = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    if (!response) {
      return res.status(400).json({ success: false, message: "Response message is required" });
    }

    const contact = await ContactUs.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    if (contact.status === 'respond') {
      return res.status(400).json({ success: false, message: "Already responded" });
    }

    await sendEmail(contact.email, "Response to your query", response);

    contact.response = response;
    contact.status = 'respond';
    contact.respondedAt = new Date();
    await contact.save();

    res.status(200).json({ success: true, message: "Response sent successfully", data: contact });
  } catch (err) {
    console.error("Respond Contact Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send response" });
  }
};
