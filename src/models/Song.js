const mongoose = require("mongoose");

const Song = mongoose.model("Song", {
  artist: String,
  title: String,
});

module.exports = {
  Song,
};
