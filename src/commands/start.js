const { SlashCommandBuilder } = require('@discordjs/builders');
const { assignRoles, messageRoles } = require('../api/role');
const { client } = require('../config/client');
const { sendErrorMessage } = require('../helpers/errorSend');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Start game of avalon with current configurations."),
    async execute(interaction) {
        // randomly assign roles to each player
        const { guildId, channelId } = interaction;
        let updatedGame = await assignRoles(guildId);
        if (await sendErrorMessage(interaction, updatedGame)) return;

        // dm each player their role
        await messageRoles(guildId);
        interaction.reply({ content: "Roles of each player has been DM'd." });

        client.emit("startGame", guildId, channelId);
        // client.emit("chooseMagicToken", guildId);
    }
};
