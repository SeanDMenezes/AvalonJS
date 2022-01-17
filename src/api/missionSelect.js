const { MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const { dmChannelByID } = require("../helpers/sendChannelMessage");
const { dmUserByID } = require("../helpers/userDM");
const { Games } = require("../models/games");
const { Players } = require("../models/players");
const missionNumbers = require("../types/missionNumbers");
const { getPlayerName, getPlayerDiscordID } = require("./player");

const handleMissonParticipants = async (serverID, players) => {
    const updatedGame = await Games.findOneAndUpdate({ serverID }, 
        { onMission: players }
    );
    return await updatedGame.save();
}

const handleMagicToken = async (serverID, player) => {
    const updatedGame = await Games.findOneAndUpdate({ serverID }, 
        { magicToken: player }
    );
    const updatedPlayer = await Players.findByIdAndUpdate(player,
        { hasMagicToken: true }
    );
    await updatedPlayer.save();
    return await updatedGame.save();
}

const sendLeaderOptions = async (serverID) => {
    const game = await Games.findOne({ serverID });
    if (!game) throw Error("No games active in this server");

    const { leader, players, missionNumber } = game;
    const playerLeader = await Players.findById(leader);
    const { discordID } = playerLeader;
    const requiredParticipants = missionNumbers[missionNumber - 1];

    const options = await Promise.all(players.map(async (playerID) => {
        const player = await Players.findById(playerID);
        const { discordName } = player;
        return {
            label: discordName,
            description: `Choose ${discordName} to be on the mission`,
            value: playerID.toString()
        }
    }));

    const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(`missionParticipants ${serverID}`)
            .setPlaceholder('Nothing selected')
            .setMinValues(requiredParticipants)
            .setMaxValues(requiredParticipants)
            .addOptions(options),
    );
    return await dmUserByID(discordID, { content: `Choose ${requiredParticipants} for this mission`, components: [row] });
}

const sendMagicTokenOptions = async (serverID) => {
    const game = await Games.findOne({ serverID });
    if (!game) throw Error("No games active in this server");

    const { leader, onMission } = game;
    const discordID = await getPlayerDiscordID(leader);

    const options = await Promise.all(onMission.map(async (playerID) => {
        const player = await Players.findById(playerID);
        const { discordName } = player;
        return {
            label: discordName,
            description: `Choose ${discordName} to have the magic token for the next mission:`,
            value: playerID.toString()
        }
    }));

    const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(`magicToken ${serverID}`)
            .setPlaceholder('Nothing selected')
            .addOptions(options),
    );
    return await dmUserByID(discordID, { content: `Choose who should have the magic token for this mission:`, components: [row] });
}

const sendMissionSelections = async (serverID, channelID) => {
    const game = await Games.findOne({ serverID });
    const { leader, onMission, magicToken } = game;
    const leaderID = await getPlayerDiscordID(leader);
    const magicTokenID = await getPlayerDiscordID(magicToken);
    const onMissionNames = await Promise.all(onMission.map(async playerID => `<@${await getPlayerDiscordID(playerID)}>`));
    const content = `<@${leaderID}> chose ${onMissionNames.join(", ")} on the mission. <@${magicTokenID}> has the Magic Token.`;
    return await dmChannelByID(channelID, { content });
}

module.exports = { handleMissonParticipants, handleMagicToken, sendLeaderOptions, sendMagicTokenOptions, sendMissionSelections };