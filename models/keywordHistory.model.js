const mongoose = require("mongoose");

let keywordHistorySchema = new mongoose.Schema({
  keyword: {
    type: String,
    default: null,
  },
  _keywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Keyword",
    default: null,
  },
  keywordData: [
    {
      date: {
        type: Date,
        default: null,
      },
      rank: {
        type: Number,
        default: null,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const KeywordHistory = mongoose.model("KeywordHistory", keywordHistorySchema);
module.exports = KeywordHistory;
