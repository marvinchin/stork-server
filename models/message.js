import mongoose, { Schema } from "mongoose";

const MessageSchema = Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  trade: { type: Schema.ObjectId, ref: "Trade", required: true }
});
export default mongoose.model("Message", MessageSchema);
