const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { dmChannelByID } = require("../helpers/sendChannelMessage");
const { dmUserByID } = require("../helpers/userDM");
const { Games } = require("../models/games");
const { Players } = require("../models/players");
const allegiances = require("../types/allegiances");
const missionNumbers = require("../types/missionNumbers");
const { getPlayerDiscordID } = require("./player");

const sendComebackOptions = async (serverID) => {
    const game = await Games.findOne({ serverID });
    if (!game) throw Error("No games active in this server");

    const { players } = game;

    const options = await Promise.all(players.map(async (playerID) => {
        const player = await Players.findById(playerID);
        const { discordName } = player;
        return {
            label: discordName,
            description: `Guess that ${discordName} is one of the evil characters`,
            value: playerID.toString()
        }
    }));

    const row = new ActionRowBuilder()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`comebackMechanic ${serverID}`)
            .setPlaceholder('Nothing selected')
            .setMinValues(2)
            .setMaxValues(2)
            .addOptions(options),
    );

    for (const playerID of players) {
        const discordID = await getPlayerDiscordID(playerID);
        await dmUserByID(discordID, { content: `Choose the 2 players you think are evil.`, components: [row] });
    }
}

const handleComebackMechanic = async (serverID, players, user) => {
    const guesser = await Players.findOne({ discordID: user });
    const newGuess = {
        guesser: guesser._id.toString(),
        guesses: players
    };

    const updatedGame = await Games.findOneAndUpdate({ serverID }, 
        { $addToSet: { comebackGuesses: newGuess } },
        { new: true }
    );
    return await updatedGame.save();
}

const sendComebackGuesses = async (serverID, channelID) => {
    const game = await Games.findOne({ serverID });
    const { comebackGuesses } = game;

    let content = "The following guesses were made:";
    for (const guess of comebackGuesses) {
        const { guesser, guesses } = guess;
        const guesserID = await getPlayerDiscordID(guesser);
        const guess1ID = await getPlayerDiscordID(guesses[0]);
        const guess2ID = await getPlayerDiscordID(guesses[1]);

        content += `\n<@${guesserID}> chose <@${guess1ID}> and <@${guess2ID}>`;
    }

    await dmChannelByID(channelID, { content });
}

const comebackSuccessful = async (serverID) => {
    const game = await Games.findOne({ serverID });
    const { players, comebackGuesses } = game;

    const playerList = await Promise.all(players.map(async playerID => await Players.findById(playerID)));
    const goodListIDs = playerList.filter(({ allegiance }) => allegiance === allegiances.RESISTANCE).map(player => player._id.toString());
    const evilListIDs = playerList.filter(({ allegiance }) => allegiance === allegiances.SPY).map(player => player._id.toString());

    const goodGuesses = comebackGuesses.filter(({ guesser }) => goodListIDs.includes(guesser.toString()));

    // both good need to guess both evil
    let goodWins = true;
    for (const guess of goodGuesses) {
        const { guesses } = guess;
        if (evilListIDs.sort().join(',') !== guesses.sort().join(',')) {
            goodWins = false;
            break;
        }
    }

    // one good needs to guess both evil
    // let goodWins = false;
    // for (const guess of goodGuesses) {
    //     const { guesses } = guess;
    //     if (evilListIDs.sort().join(',') === guesses.sort().join(',')) {
    //         goodWins = true;
    //         break;
    //     }
    // }

    // one good needs to guess both evil and roles
    // let goodWins = false;
    // for (const guess of goodGuesses) {
    //     const { guesses } = guess;
    //     if (evilListIDs.sort().join(',') === guesses.sort().join(',')) {
    //         goodWins = true;
    //         break;
    //     }
    // }

    return goodWins;
}

module.exports = { sendComebackOptions, handleComebackMechanic, sendComebackGuesses, comebackSuccessful };
