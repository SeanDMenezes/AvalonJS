const { client } = require("../config/client");

const dmUserByID = async (playerID, message) => {
    // console.log("sending message", playerID, message);
    const user = await client.users.fetch(playerID).catch(() => null);
    if (!user) console.error("User not found :(");
    return await user.send(message).catch((err) => {
        console.error(err);
        console.error("User has DMs closed or has no mutual servers with the bot:(");
    });
}

module.exports = { dmUserByID };
