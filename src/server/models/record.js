const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-simple-random');
const mongoosePaginate = require('mongoose-paginate');

const config = require('../../shared/config');

const RecordSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: config.RECORD_TYPES,
    index: { unique: true }
  },
  playerName: { type: String, required: true },
  value: { type: Number, required: true },
  drawing: { type: mongoose.Schema.Types.Mixed }
});

RecordSchema.plugin(mongooseRandom);
RecordSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Record', RecordSchema);
