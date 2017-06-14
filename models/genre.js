import mongoose, { Schema } from 'mongoose';

/*
  Title holds the string value for the genre.
*/
const GenreSchema = Schema({
  title: { type: String, required: true },
});

export default mongoose.model('Genre', GenreSchema);
