const { SlashCommandBuilder } = require('@discordjs/builders');
const { createGame } = require('./../api/game');
const { sendErrorMessage } = require('../helpers/errorSend');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avalon")
        .setDescription("Start a game of Avalon (if not already active in server)"),
    async execute(interaction) {
        const { guildId } = interaction;
        const newGame = await createGame(guildId);
        if (await sendErrorMessage(interaction, newGame)) return;
        interaction.reply({ content: "Welcome to Avalon. Join game to start." })
    }
};
