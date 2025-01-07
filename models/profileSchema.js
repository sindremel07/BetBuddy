const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    userId: { type: String, require: true, unique: true },
    serverId: { type: String, require: true },

    balance: { type: Number, default: 50 },
    net: { type: Number, default: 50 },

    dailyLastUsed: {type: Number, default: 0},
    hourlyLastUsed: {type: Number, default: 0},
    rouletteLastUsed: {type: Number, default: 0},
    
    shifts: {type: Number, default: 0},
    currentJob: {type: String, default: "none"},
    lastTimeWorked: {type: Number, default: 0},
    
    totalCommands: {type: Number, default: 0},
    inventory: {type: Array, default: null},
    
    itemLastUsed: {type: Number, default: 0},
    currentUsedItem: {type: String, default: "none"},
    currentUsedItemDuration: {type: Number, default: 0},
    
    amountLost: {type: Number, default: 0},
    amountWon: {type: Number, default: 0},
});

const model = mongoose.model("betbuddydb", profileSchema);

module.exports = model;