const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: [{ type: Schema.ObjectId, ref: 'Genre' }],
});

module.exports = mongoose.model('Book', BookSchema);
