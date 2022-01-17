const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { client } = require('../config/client');
const { Games } = require('../models/games');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong"),
    async execute(interaction) {
        // console.log(interaction);
		interaction.reply({ content: "pong" });
    }
};
