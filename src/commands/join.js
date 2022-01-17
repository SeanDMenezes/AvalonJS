const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinGame } = require('../api/game');
const { sendErrorMessage } = require('../helpers/errorSend');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Join game of Avalon"),
    async execute(interaction) {
        const { user, guildId } = interaction;
        const updatedGame = await joinGame(guildId, user);
        if (await sendErrorMessage(interaction, updatedGame)) return;
        interaction.reply({ content: `<@${user.id}> successfully joined the game.` })
    }
};
