const { sendComebackOptions, sendComebackGuesses, comebackSuccessful } = require('../api/comeback');
const { analyzeAndUpdateGame, resetGame } = require('../api/game');
const { sendPassFailOptions, sendMissionStatus, chooseNewLeader } = require('../api/mission');
const { sendLeaderOptions, sendMagicTokenOptions, sendMissionSelections } = require('../api/missionSelect');
const { getPlayerDiscordID } = require('../api/player');
const { sendFinalRoles } = require('../api/role');
const { dmChannelByID } = require('../helpers/sendChannelMessage');
const { waitFor } = require('../helpers/waitFor');
const { Games } = require("../models/games");
const missionNumbers = require('../types/missionNumbers');

module.exports = {
	name: "startGame",
	once: false,
	async execute(serverID, channelID) {
		try {
            let game = await Games.findOne({ serverID });

            let { totalSuccesses, totalFailures, missionNumber } = game;
            let content = "";

            while (totalSuccesses < 3 && totalFailures < 2) {
                const numOnMission = missionNumbers[missionNumber - 1];

                // past mission 1, previous leader must choose new leader for mission
                if (missionNumber > 1) {
                    const leaderID = await getPlayerDiscordID(game.leader);
                    content = `<@${leaderID}> is choosing the leader of the next mission.`;
                    await dmChannelByID(channelID, { content });
                    await chooseNewLeader(serverID);
                    let { prevLeaders } = game;
                    while (prevLeaders.length !== missionNumber - 1) {
                        await waitFor(5000);
                        game = await Games.findOne({ serverID });
                        ({ prevLeaders } = game);
                    }
                }

                // choose players for next mission
                const leaderID = await getPlayerDiscordID(game.leader);
                content = `<@${leaderID}> is choosing ${numOnMission} people for the next mission.`;
                await dmChannelByID(channelID, { content });
                await sendLeaderOptions(serverID);
                let { onMission } = game;
                while (onMission.length !== numOnMission) {
                    await waitFor(5000);
                    game = await Games.findOne({ serverID });
                    ({ onMission } = game);
                }

                // choose magic token for next mission
                await sendMagicTokenOptions(serverID);
                let { magicToken } = game;
                while (!magicToken) {
                    await waitFor(5000);
                    game = await Games.findOne({ serverID });
                    ({ magicToken } = game);
                }

                // send message to everyone else notifying what leader chose
                await sendMissionSelections(serverID, channelID);

                // dm each player on mission with choice to pass/fail
                await sendPassFailOptions(serverID);
                let { missionPasses, missionFails } = game;
                while (missionPasses + missionFails !== numOnMission) {
                    await waitFor(5000);
                    game = await Games.findOne({ serverID });
                    ({ missionPasses, missionFails } = game);
                }

                // if >= 1 fail, mission failed
                await sendMissionStatus(serverID, channelID);

                // update game state for next mission, or for end of game
                game = await analyzeAndUpdateGame(serverID);
                ({ totalSuccesses, totalFailures, missionNumber } = game);
                content = `There are now ${totalSuccesses} successful mission(s) and ${totalFailures} failed mission(s).`;
                await dmChannelByID(channelID, { content });
            }

            // 3 passes, good auto-wins
            if (totalSuccesses === 3) {
                content = `Resistance wins the game!`;
                await dmChannelByID(channelID, { content });
            }
            // 2 fails, comeback mechanic for good
            else if (totalFailures === 2) {
                content = `Evil players reached two fails. Both good players must now correctly identify both evil players to win the game.`;
                await dmChannelByID(channelID, { content });
                await sendComebackOptions(serverID);
                let { comebackGuesses } = game;
                while (comebackGuesses.length !== 4) {
                    await waitFor(5000);
                    game = await Games.findOne({ serverID });
                    ({ comebackGuesses } = game);
                }

                await sendComebackGuesses(serverID, channelID);
                if (await comebackSuccessful(serverID)) {
                    content = `Both good players have correctly identified the evil players. Resistance wins the game!`;
                    await dmChannelByID(channelID, { content });
                } else {
                    content = `Spies win the game!`;
                    await dmChannelByID(channelID, { content });
                }
            }
            // something went wrong
            else {
                console.log("Something went wrong");
            }

            await sendFinalRoles(serverID, channelID);
            await resetGame(serverID);
        } catch (err) {
            console.error(err);
            return { error: err };
        }
	},
};
