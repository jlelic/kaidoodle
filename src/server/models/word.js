const mongoose = require('mongoose');


const WordSchema = new mongoose.Schema({
  word: { type: String, required: true, index: { unique: true } },
  addedBy: { type: String, required: true }
});

module.exports = mongoose.model('Word', WordSchema);
