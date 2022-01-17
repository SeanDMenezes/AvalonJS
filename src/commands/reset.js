const { SlashCommandBuilder } = require('@discordjs/builders');
const { deleteGame } = require('./../api/game');
const { sendErrorMessage } = require('../helpers/errorSend');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Reset any game of Avalon currently active in the server."),
    async execute(interaction) {
        const serverID = interaction.guildId;
        const deletedGame = await deleteGame(serverID);
        if (await sendErrorMessage(interaction, deletedGame)) return;
        interaction.reply({ content: "Successfully reset any active games in the server." })
    }
};