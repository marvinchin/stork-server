import mongoose, { Schema } from 'mongoose';

const BookSchema = Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: [{ type: Schema.ObjectId, ref: 'Genre' }],
});

export default mongoose.model('Book', BookSchema);
