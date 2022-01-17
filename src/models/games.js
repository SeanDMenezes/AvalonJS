const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const GamesSchema = mongoose.Schema({
    serverID: String,
    players: [{ type: Schema.Types.ObjectId, ref: "Players" }],
    inProgress: Boolean,
    leader: { type: Schema.Types.ObjectId, ref: "Players" },
    prevLeaders: [{ type: Schema.Types.ObjectId, ref: "Players" }],
    onMission: [{ type: Schema.Types.ObjectId, ref: "Players" }],
    missionPasses: Number,
    missionFails: Number,
    magicToken: { type: Schema.Types.ObjectId, ref: "Players" },
    missionNumber: Number,
    totalSuccesses: Number,
    totalFailures: Number,
    comebackGuesses: [Object],
    missionHistory: [Object]
});

const Games = mongoose.model("Games", GamesSchema);

module.exports = { GamesSchema, Games };
