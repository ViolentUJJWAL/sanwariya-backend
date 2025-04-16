const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Email must be a valid email address"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  response: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'respond'],
    default: 'pending',
  },
  respondedAt: {
    type: Date,
  },
}, {timestamps:true});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);
module.exports =  ContactUs;