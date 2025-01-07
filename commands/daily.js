const { SlashCommandBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { dailyMin, dailyMax } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Redeem free daily coins"),
    async execute(interaction, profileData) {
        const {id} = interaction.user;
        const {dailyLastUsed} = profileData;
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});

        const cooldown = 86400000;
        const timeLeft = cooldown - (Date.now() - dailyLastUsed);

        if(timeLeft > 0) {
            await interaction.deferReply({ ephermeral: true });
            const { hours, minutes, seconds } = parseMilliseconds(timeLeft);
            return await interaction.editReply(`Claim your next daily in ${hours} hrs ${minutes} min ${seconds} sec`);
        }

        await interaction.deferReply();

        const randomAmt = Math.floor(Math.random() * (dailyMax - dailyMin + 1) + dailyMin);

        try {
            await profileModel.findOneAndUpdate(
                {userId: id},
                {
                    $set: {
                        dailyLastUsed: Date.now(),
                    },
                    $inc: {
                        balance: randomAmt,
                        net: randomAmt,
                    },
                }
            );
        } catch (err) {
            console.log(err);
        }

        await interaction.editReply(`You redeemed ${randomAmt} coins!`)
    },
};
