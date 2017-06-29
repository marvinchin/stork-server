import mongoose, { Schema } from 'mongoose';

const BookSchema = Schema({
  owner: { type: Schema.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: Schema.ObjectId, ref: 'Genre' },
  dateListed: { type: Date, required: true },
  description: { type: String, default: '' },
});

export default mongoose.model('Book', BookSchema);
