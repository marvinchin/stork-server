import mongoose, { Schema } from 'mongoose';

const TradeSchema = Schema({
  listUser: { type: String, required: true },
  offerUser: { type: String, required: true },
  listBook: { type: Schema.ObjectId, ref: 'Book', required: true },
  offerBooks: [{ type: Schema.ObjectId, ref: 'Book', required: true }],
  description: { type: String, default: '', required: true },
  selectedBook: { type: Schema.ObjectId },
  tradeStatus: { type: String, enum: ['P', 'A', 'C', 'OC', 'LC', 'BC'], required: true },
});

export default mongoose.model('Trade', TradeSchema);
