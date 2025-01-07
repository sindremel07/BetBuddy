const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donate")
        .setDescription("Donate your coins to another user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user you want to donate to")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of coins you want to donate")
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const recieveUser = interaction.options.getUser("user");
        const donateAmt = interaction.options.getInteger("amount");

        const { balance } = profileData;

        if(balance < donateAmt) {
            await interaction.deferReply({ ephemeral: true });
            return await interaction.editReply(`You do not have **${donateAmt.toLocaleString('en-US')}** coins in your balance`);
        }

        const recieveUserData = await profileModel.findOneAndUpdate(
            {
                userId: recieveUser.id,
            },
            {
                $inc: {
                    balance: donateAmt,
                    net: donateAmt,
                },
            }
        );

        if(!recieveUserData){
            await interaction.deferReply({ ephemeral: true });
            return await interaction.editReply(`***${recieveUser.globalName}*** is not in the currency system`);
        }

        await interaction.deferReply();

        await profileModel.findOneAndUpdate(
            {
                userId: interaction.user.id,
            },
            {
                $inc: {
                    balance: -donateAmt,
                },
            }
        );

        interaction.editReply(`You have donated **${donateAmt.toLocaleString('en-US')}** coins to ***${recieveUser.globalName}***`)
        
    },
};
