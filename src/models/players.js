const mongoose = require("mongoose");
const ALLEGIANCES = require("../types/allegiances");
const CHARACTERS = require("../types/characters");

const PlayersSchema = mongoose.Schema({
    discordID: String,
    discordName: String,
    character: { type: String, enum: CHARACTERS },
    allegiance: { type: String, enum: ALLEGIANCES },
    hasMagicToken: Boolean
});

const Players = mongoose.model("Players", PlayersSchema);

module.exports = { PlayersSchema, Players };
