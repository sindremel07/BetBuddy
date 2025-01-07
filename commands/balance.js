const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Shows a user their balance")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Check the balance of the user")
                .setRequired(false)
        ),
    async execute(interaction, profileData) {
        const username = interaction.user.globalName;
        const userToCheck = interaction.options.getUser("user");

        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        
        if (userToCheck) {
            const userToCheckPD = await profileModel.findOne({userId: userToCheck.id});
            const { balance } = userToCheckPD;
            const formattedBalance = formatBalance(balance);

            const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setAuthor({ name: "🪙 Balance" })
                .setDescription(`**Balance**: ${formattedBalance} coins`)
                .setTimestamp()
                .setFooter({ text: userToCheck.globalName, iconURL: userToCheck.avatarURL() });
    
            await interaction.reply({ embeds: [embed] });
        } else { 
            const { balance } = profileData;
            const formattedBalance = formatBalance(balance);

            const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setAuthor({ name: "🪙 Balance" })
                .setDescription(`**Balance**: ${formattedBalance} coins`)
                .setTimestamp()
                .setFooter({ text: username, iconURL: interaction.user.avatarURL() });
    
            await interaction.reply({ embeds: [embed] });
        }
    },
};

function formatBalance(userBalance) {
    if (userBalance >= 1e21) { // Sextillions
        return `${(userBalance / 1e21).toFixed(1)}S`;
    } else if (userBalance >= 1e18) { // Quintillions
        return `${(userBalance / 1e18).toFixed(1)}Qi`;
    } else if (userBalance >= 1e15) { // Quadrillions
        return `${(userBalance / 1e15).toFixed(1)}Q`;
    } else if (userBalance >= 1e12) { // Trillions
        return `${(userBalance / 1e12).toFixed(1)}T`;
    } else if (userBalance >= 1e9) { // Billions
        return `${(userBalance / 1e9).toFixed(1)}B`;
    } else if (userBalance >= 1e6) { // Millions
        return `${(userBalance / 1e6).toFixed(1)}M`;
    } else {
        return userBalance.toLocaleString('en-US');
    }
}