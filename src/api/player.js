const { Players } = require("../models/players");

const getPlayerName = async (playerID) => {
    try {
        const player = await Players.findById(playerID);
        return player.discordName;
    } catch (err) {
        return { error: err };
    }
}

const getPlayerDiscordID = async (playerID) => {
    try {
        const player = await Players.findById(playerID);
        return player.discordID;
    } catch (err) {
        return { error: err };
    }
}

module.exports = { getPlayerName, getPlayerDiscordID };
