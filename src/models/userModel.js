const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  balance: {
    type: Number,
    default: 100,
    min: [0, 'Balance cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
