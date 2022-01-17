const { dmChannelByID } = require("../helpers/sendChannelMessage");
const { dmUserByID } = require("../helpers/userDM");
const { Games } = require("../models/games");
const { Players } = require("../models/players");
const allegiances = require("../types/allegiances");
const characters = require("../types/characters");
const roles = require("../types/roles");

const assignRoles = async (serverID) => {
    try {
        const game = await Games.findOne({ serverID });
        if (!game) throw Error("No game active in this server");
        // if (game.inProgress) throw Error("Game already in progress in this server");

        const rolesInPlay = [roles.SERVANT, roles.SERVANT, roles.MORGAN, roles.SCION];
        const { players } = game;
        if (players.length !== 4) {
            throw Error("There must be exactly 4 players to begin the game.");
        }
    
        // shuffle available roles and players, randomly assign them
        const shuffledRoles = rolesInPlay.sort(() => Math.random() - 0.5);
        const shuffledPlayers = players.sort(() => Math.random() - 0.5);
        shuffledPlayers.forEach(async (playerId, i) => {
            const player = await Players.findById(playerId);
            const role = shuffledRoles[i];
            const { name, allegiance } = role;
            player.character = name;
            player.allegiance = allegiance;
            await player.save();
        });

        // randomly assign leader
        const leaderIndex = Math.floor(Math.random() * 4);
        const firstLeader = shuffledPlayers[leaderIndex];
        game.leader = firstLeader;

        game.inProgress = true;
        return await game.save();
    } catch (err) {
        return { error: err };
    }
}

const messageRoles = async (serverID) => {
    try {
        const game = await Games.findOne({ serverID });
        const { players } = game;
        const playerList = await Promise.all(players.map(async playerID => await Players.findById(playerID)));
        const evilList = playerList.filter(({ allegiance }) => allegiance === allegiances.SPY);

        playerList.forEach(async player => {
            const { discordID, character, allegiance } = player;
            let message = `Your role is ${player.character} who is a ${player.allegiance} character.`;
            switch (character) {
                case characters.SCION:
                    message += " The other spy is unknown to you.";
                    break;
                case characters.MORGAN:
                    const scion = evilList.find(({ character }) => character === characters.SCION);
                    // console.log(scion);
                    message += ` The other spy is ${scion.discordName}`;
                    break;
                default:
                    break;
            }
            await dmUserByID(discordID, message);
        });
    } catch (err) {
        console.log(err);
        return { error: err };
    }
}

const sendFinalRoles = async (serverID, channelID) => {
    const game = await Games.findOne({ serverID });
    const { players } = game;
    let content = "These were the roles of each player:";
    for (const playerID of players) {
        const player = await Players.findById(playerID);
        const { discordID, character } = player;
        content += `\n<@${discordID}> - ${character}`;
    }

    await dmChannelByID(channelID, { content });
}

module.exports = { assignRoles, messageRoles, sendFinalRoles };
