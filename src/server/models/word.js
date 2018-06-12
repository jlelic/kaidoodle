const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');


const WordSchema = new mongoose.Schema({
  word: { type: String, required: true, index: { unique: true } },
  addedBy: { type: String, required: true }
});

WordSchema.plugin(mongooseRandom);

module.exports = mongoose.model('Word', WordSchema);
