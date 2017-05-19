import mongoose, { Schema } from 'mongoose';

/*
  username is unique and alphanumeric lowercase, and must be between 4 and 20 characters long.

  password is between 6 and 24 characters long, no spaces.

  email must be lowercase to prevent conflicts

  authorizedTokens stores an array of tokens(Strings) authorized
  by the user, with a given expiry date.
*/
const UserSchema = Schema({
  username: { type: String, required: true, lowercase: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  description: { type: String, max: 100 },
  email: { type: String, required: true, lowercase: true },
  hashedPassword: { type: String, required: true },
  authorizedTokens: [{ id: String, expiry: Date }],
  books: [{ type: Schema.ObjectId, ref: 'Book' }],
});

export default mongoose.model('User', UserSchema);
