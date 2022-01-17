const fs = require("fs");
const mongoose = require('mongoose');

// Loading the token from .env file
const dotenv = require('dotenv');
dotenv.config();
const TOKEN = process.env.TOKEN;
const TEST_GUILD_ID = process.env.TEST_GUILD_ID;
const DB_CONNECTION = process.env.DB_CONNECTION;

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// Require the necessary discord.js classes
const { Collection } = require('discord.js');

// Create a new client instance
const { client } = require("./src/config/client");
const { handleSelectInteractions, handleButtonInteractions } = require("./src/selectMenuInteractions/interactions");

// Loading commmands from the commands folder
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
const commands = [];

// Creating a collection for commands in client
client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

for (const file of eventFiles) {
	const event = require(`./src/events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// When the client is ready, this only runs once
client.once('ready', () => {
    console.log('Ready!');
    // Registering the commands in the client
    const CLIENT_ID = client.user.id;
    const rest = new REST({
        version: '9'
    }).setToken(TOKEN);
    (async () => {
        try {
            if (!TEST_GUILD_ID) {
                await rest.put(
                    Routes.applicationCommands(CLIENT_ID), {
                        body: commands
                    },
                );
                console.log('Successfully registered application commands globally');
            } else {
                await rest.put(
                    Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID), {
                        body: commands
                    },
                );
                console.log('Successfully registered application commands for development guild');
            }
        } catch (error) {
            if (error) console.error(error);
        }
    })();
});

// select menu and button handler
client.on('interactionCreate', async interaction => {
    if (interaction.isSelectMenu()) return await handleSelectInteractions(interaction);
    if (interaction.isButton()) return await handleButtonInteractions(interaction);
    else return;
});

// connect to db
mongoose.connect(
    DB_CONNECTION, 
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(res => console.log("connected to db")).catch(err => console.log(err));

// Login to Discord with your client's token
client.login(TOKEN);
