const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');
const mongoosePaginate = require('mongoose-paginate');


const WordSchema = new mongoose.Schema({
  word: { type: String, required: true, index: { unique: true } },
  addedBy: { type: String, required: true },
  deletedBy: { type: String },
  deleted: { type: Boolean, required: true, default: false },
  played: { type: Number, default: 0}
});

WordSchema.plugin(mongooseRandom);
WordSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Word', WordSchema);
