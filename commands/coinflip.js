const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Flip a coin to either double or loose all")
        .addStringOption((option) => 
            option
                .setName("choice")
                .setDescription("heads or tails")
                .setRequired(true)
                .addChoices(
                    { name: "Heads", value: "Heads"},
                    { name: "Tails", value: "Tails"},
                )
        )
        .addIntegerOption((option) => 
            option
                .setName("amount")
                .setDescription("amount to bet")
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const { id } = interaction.user;
        const { balance } = profileData;
        const amount = interaction.options.getInteger("amount");

        const randomNum = Math.round(Math.random());
        const result = randomNum ? "Heads" : "Tails";
        const choice = interaction.options.getString("choice");
        const winningAmount = amount * 2;

        if(balance < amount) {
            await interaction.deferReply({ ephemeral: true });
            return await interaction.editReply(`You do not have **${amount}** coins in your balance`);
        }

        await interaction.deferReply();
        
        if(choice === result) {
            await profileModel.findOneAndUpdate(
                {
                    userId: id,
                },
                {
                    $inc: {
                        balance: winningAmount,
                        net: winningAmount,
                        amountWon: winningAmount,
                    },
                }
            );

            await interaction.editReply(`Winner! You won **${winningAmount}** coins with **${choice}**`);
        } else {
            await profileModel.findOneAndUpdate(
                {
                    userId: id,
                },
                {
                    $inc: {
                        balance: -amount,
                        amountLost: amount
                    },
                }
            );

            await interaction.editReply(`Lost... You lost **${amount}** coins`);
        }

    },
};
