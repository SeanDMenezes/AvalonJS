const { MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const { dmChannelByID } = require("../helpers/sendChannelMessage");
const { dmUserByID } = require("../helpers/userDM");
const { Games } = require("../models/games");
const { Players } = require("../models/players");
const characters = require("../types/characters");
const missionNumbers = require("../types/missionNumbers");
const { getPlayerName, getPlayerDiscordID } = require("./player");

const sendPassFailOptions = async (serverID) => {
    const game = await Games.findOne({ serverID });
    const { onMission } = game;

    onMission.forEach(async playerID => {
        const player = await Players.findById(playerID);
        const { discordID, hasMagicToken, character } = player;
        const failDisabled = hasMagicToken && character !== characters.MORGAN;

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`pass ${serverID}`)
                    .setLabel("Pass")
                    .setStyle("SUCCESS"),
                new MessageButton()
                    .setCustomId(`fail ${serverID}`)
                    .setLabel("Fail")
                    .setStyle("DANGER")
                    .setDisabled(failDisabled),
            );
        let content = "Choose whether to pass or fail this mission.";
        if (failDisabled) content += " Since you were given the Magic Token, you are unable to fail this mission.";
        await dmUserByID(discordID, { content, components: [row] });
    });
}

const handlePassFail = async (serverID, isPass) => {
    const updatedGame = await Games.findOneAndUpdate({ serverID },
        { $inc: isPass ? { missionPasses: 1 } : { missionFails: 1 }}    
    );
    return await updatedGame.save();
}

const sendMissionStatus = async (serverID, channelID) => {
    const game = await Games.findOne({ serverID });
    const { missionFails } = game;
    let content = "";
    if (missionFails > 1) {
        content += `The mission failed. ${missionFails} people failed that mission.`;
    } else if (missionFails == 1) {
        content += `The mission failed. ${missionFails} person failed that mission.`;
    } else {
        content += "The mission passed.";
    }
    return await dmChannelByID(channelID, { content });
}

const chooseNewLeader = async (serverID) => {
    const game = await Games.findOne({ serverID });
    if (!game) throw Error("No games active in this server");

    let { leader, prevLeaders, players } = game;
    const discordID = await getPlayerDiscordID(leader);

    prevLeaders.push(leader);
    const remainingOptions = players.filter(playerID => !prevLeaders.includes(playerID));

    const options = await Promise.all(remainingOptions.map(async playerID => {
        const discordName = await getPlayerName(playerID);
        return {
            label: discordName,
            description: `Choose ${discordName} to be the leader for the next mission`,
            value: playerID.toString()
        }
    }));

    const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(`newLeader ${serverID}`)
            .setPlaceholder('Nothing selected')
            .addOptions(options),
    );
    return await dmUserByID(discordID, { content: `Choose who should be the leader for the next mission:`, components: [row] });
}

const handleLeaderSelection = async (serverID, player) => {
    const game = await Games.findOne({ serverID });
    let { leader, prevLeaders } = game;
    prevLeaders.push(leader);

    const updatedGame = await Games.findOneAndUpdate({ serverID }, 
        { leader: player, prevLeaders },
        { new: true } 
    );
    return await updatedGame.save();
}

module.exports = { sendPassFailOptions, handlePassFail, sendMissionStatus, chooseNewLeader, handleLeaderSelection };