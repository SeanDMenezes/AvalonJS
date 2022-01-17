const { Games } = require("../models/games");
const { Players } = require("../models/players");
const allegiances = require("../types/allegiances");
const ALLEGIANCES = require("../types/allegiances");
const CHARACTERS = require("../types/characters");
const { getPlayerDiscordID } = require("./player");

const createGame = async (serverID) => {
    try {
        if (await Games.findOne({ serverID })) {
            throw Error("Game already active in this server.");
        }
        const newGame = new Games({ 
            serverID,
            players: [],
            inProgress: false,
            leader: null,
            prevLeaders: [],
            missionNumber: 1,
            onMission: [],
            missionPasses: 0,
            missionFails: 0,
            magicToken: null,
            totalSuccesses: 0,
            totalFailures: 0,
            comebackGuesses: [],
            missionHistory: []
        });
        return await newGame.save();
    } catch (error) {
        return { error };
    }
}

const joinGame = async (serverID, user) => {
    try {
        const game = await Games.findOne({ serverID });
        if (!game) throw Error("No game active in this server");
        if (game.inProgress) throw Error("Can't join a game in progress");
        for (let playerID of game.players) {
            const discordID = await getPlayerDiscordID(playerID);
            if (user.id === discordID) {
                throw Error("Player is already in current game.");
            }
        }

        const newPlayer = new Players({
            discordID: user.id,
            discordName: user.username,
            character: CHARACTERS.SERVANT,
            allegiance: ALLEGIANCES.RESISTANCE,
            hasMagicToken: false
        });
        await newPlayer.save();

        const updatedGame = await Games.findOneAndUpdate({ serverID },
            { $addToSet: { players: newPlayer._id }},
            { new: true }  
        );
        return await updatedGame.save();
    } catch (err) {
        return { error: err };
    }
}

const leaveGame = async (serverID, user) => {
    try {
        const game = await Games.findOne({ serverID });
        const player = await Players.findOne({ discordID: user.id });

        if (!game) throw Error("No game active in this server");
        if (game.inProgress) throw Error("Can't leave a game in progress");
        if (!player) throw Error("Player not in party");

        const updatedGame = await Games.findOneAndUpdate({ serverID },
            { $pull: { players: player._id }},
            { new: true }  
        );
        await Players.findByIdAndDelete(player._id);

        return await updatedGame.save();
    } catch (err) {
        return { error: err };
    }
}

const deleteGame = async (serverID) => {
    try {
        const toDelete = await Games.findOne({ serverID });
        if (!toDelete) {
            throw Error("No game active in this server");
        }
        toDelete.players.forEach(async player => {
            await Players.findByIdAndDelete(player);
        });
        return await Games.deleteOne({ serverID });
    } catch (error) {
        return { error };
    }
}

// runs after game over
const resetGame = async (serverID) => {
    const game = await Games.findOne({ serverID });
    game.players.forEach(async playerID => {
        const updatedPlayer = await Players.findByIdAndUpdate(playerID,
            { 
                character: CHARACTERS.SERVANT,
                allegiance: ALLEGIANCES.RESISTANCE,
                hasMagicToken: false
            }  
        );
        await updatedPlayer.save();
    });

    game.inProgress = false;
    game.leader = null;
    game.prevLeaders = [];
    game.onMission = [];
    game.missionPasses = 0;
    game.missionFails = 0;
    game.magicToken = null;
    game.missionNumber = 1;
    game.totalSuccesses = 0;
    game.totalFailures = 0;
    game.comebackGuesses = [];
    game.missionHistory = [];
    return await game.save();
}

// runs after each mission
const analyzeAndUpdateGame = async (serverID) => {
    const game = await Games.findOne({ serverID });

    // if >= 1 fail on mission, whole mission fails
    if (game.missionFails >= 1) game.totalFailures += 1;
    else game.totalSuccesses += 1;

    // reset magic token holder
    const magicTokenPlayer = await Players.findByIdAndUpdate(game.magicToken,
        { hasMagicToken: false }    
    );
    await magicTokenPlayer.save();

    game.onMission = [];
    game.missionPasses = 0;
    game.missionFails = 0;
    game.magicToken = null;
    game.missionNumber += 1;
    return await game.save();
}

module.exports = { createGame, joinGame, leaveGame, deleteGame, resetGame, analyzeAndUpdateGame };
