const { SlashCommandBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { hourlyMin, hourlyMax } = require("../globalValues.json")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hourly")
        .setDescription("Redeem free hourly coins"),
    async execute(interaction, profileData) {
        const {id} = interaction.user;
        const {hourlyLastUsed} = profileData;
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});

        const cooldown = 3600000;
        const timeLeft = cooldown - (Date.now() - hourlyLastUsed);

        if(timeLeft > 0) {
            await interaction.deferReply({ ephermeral: true });
            const { minutes, seconds } = parseMilliseconds(timeLeft);
            return await interaction.editReply(`Claim your next hourly in ${minutes} min ${seconds} sec`);
        }

        await interaction.deferReply();

        const randomAmt = Math.floor(Math.random() * (hourlyMax - hourlyMin + 1) + hourlyMin);

        try {
            await profileModel.findOneAndUpdate(
                {userId: id},
                {
                    $set: {
                        hourlyLastUsed: Date.now(),
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
