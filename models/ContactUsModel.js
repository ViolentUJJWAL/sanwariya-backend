import mongoose from 'mongoose';
import UserSchema from './UserSchema';
const contactUsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // assuming you have a User model
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: '', // empty by default
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
}, {timestamps:true});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

module.exports =  ContactUs;
