const { SlashCommandBuilder } = require('@discordjs/builders');
const { leaveGame } = require('../api/game');
const { sendErrorMessage } = require('../helpers/errorSend');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Leave game of Avalon"),
    async execute(interaction) {
        const { user, guildId } = interaction;
        const updatedGame = await leaveGame(guildId, user);
        if (await sendErrorMessage(interaction, updatedGame)) return;
        interaction.reply({ content: `<@${user.id}> successfully left the game.` })
    }
};
