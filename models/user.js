import mongoose, { Schema } from 'mongoose';

const UserSchema = Schema({
  username: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  description: { type: String, max: 100 },
  email: { type: String, required: true },
  books: [{ type: Schema.ObjectId, ref: 'Book' }],
});

export default mongoose.model('User', UserSchema);
