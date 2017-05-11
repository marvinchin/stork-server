const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = Schema({
  username: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  description: { type: String, max: 100 },
  email: { type: String, required: true },
  books: [{ type: Schema.ObjectId, ref: 'Book' }],
});

module.exports = mongoose.model('User', UserSchema);
