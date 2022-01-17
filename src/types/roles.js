const allegiances = require("./allegiances");
const characters = require("./characters");

module.exports = {
    SERVANT: {
        name: characters.SERVANT,
        allegiance: allegiances.RESISTANCE,
        description: "Vanilla good guy"
    },
    MINION: {
        name: characters.MINION,
        allegiance: allegiances.SPY,
        description: "Vanilla bad guy"
    },
    MORGAN: {
        name: characters.MORGAN,
        allegiance: allegiances.SPY,
        description: "Bad guy who magic card doesn't apply to"
    },
    SCION: {
        name: characters.SCION,
        allegiance: allegiances.SPY,
        description: "Bad guy who doesn't know other bad guy"
    },
}
