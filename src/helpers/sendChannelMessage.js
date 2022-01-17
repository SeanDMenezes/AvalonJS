const { client } = require("../config/client");

const dmChannelByID = async (channelID, message) => {
    // console.log("sending message", playerID, message);
    const channel = await client.channels.fetch(channelID).catch(() => null);
    if (!channel) console.error("Channel not found :(");
    return await channel.send(message).catch((err) => {
        console.error(err);
        console.error("Channel has DMs closed or has no mutual servers with the bot:(");
    });
}

module.exports = { dmChannelByID };
