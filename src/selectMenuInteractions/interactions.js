const { handleComebackMechanic } = require("../api/comeback");
const { handlePassFail, handleLeaderSelection } = require("../api/mission");
const { handleMissionParticipants, handleMagicToken } = require("../api/missionSelect");
const { getPlayerName, getPlayerDiscordID } = require("../api/player");

const handleSelectInteractions = async (interaction) => {
	if (interaction.customId.includes("missionParticipants")) {
        await interaction.deferUpdate();
        const { customId, values } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handleMissionParticipants(guildId, values);
        const playerNames = await Promise.all(values.map(async playerID => await getPlayerName(playerID)));
        return await interaction.editReply({ content: `You have chosen ${playerNames.join(", ")} to be on the mission.`, components: [] });
	}

    if (interaction.customId.includes("magicToken")) {
        await interaction.deferUpdate();
        const { customId, values } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handleMagicToken(guildId, values);
        const playerNames = await Promise.all(values.map(async playerID => await getPlayerName(playerID)));
        return await interaction.editReply({ content: `You have chosen ${playerNames.join(", ")} to have the Magic Token.`, components: [] });
    }

    if (interaction.customId.includes("newLeader")) {
        await interaction.deferUpdate();
        const { customId, values } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handleLeaderSelection(guildId, values);
        const playerNames = await Promise.all(values.map(async playerID => await getPlayerName(playerID)));
        return await interaction.editReply({ content: `You have chosen ${playerNames.join(", ")} to be the next leader.`, components: [] });
    }
    
	if (interaction.customId.includes("comebackMechanic")) {
        await interaction.deferUpdate();
        const { customId, values, user } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handleComebackMechanic(guildId, values, user.id);
        const playerNames = await Promise.all(values.map(async playerID => await getPlayerName(playerID)));
        return await interaction.editReply({ content: `You have guessed that ${playerNames.join(", ")} are evil.`, components: [] });
	}
}

const handleButtonInteractions = async (interaction) => {
	if (interaction.customId.includes("pass")) {
        await interaction.deferUpdate();
        const { customId } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handlePassFail(guildId, true);
        await interaction.editReply({ content: "You have chosen to pass this mission.", components: [] });
	}

    if (interaction.customId.includes("fail")) {
        await interaction.deferUpdate();
        const { customId } = interaction;
        const customIdList = customId.split(" ");
        const guildId = customIdList[customIdList.length - 1];
		await handlePassFail(guildId, false);
        await interaction.editReply({ content: "You have chosen to fail this mission.", components: [] });
    }
}

module.exports = { handleSelectInteractions, handleButtonInteractions };
