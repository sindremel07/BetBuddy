const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const choices = require("../models/choices");
const profileModel = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("See your profile stats!"),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const { balance, shifts, currentJob, net, amountLost, amountWon, totalCommands } = profileData;
        const { globalName, id } = interaction.user;
        const formattedCurrentBalance = formatBalance(balance);
        const formattedNetBalance = formatBalance(net);
        const formattedAmountLost = formatBalance(amountLost);
        const formattedAmountWon = formatBalance(amountWon);
        const amountGained = amountWon - amountLost
        const formattedAmountGained = formatBalance(amountGained);

        
            const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setTitle(`${globalName} - Profile`)
                .setThumbnail(interaction.user.avatarURL())
                .addFields(
                    { name: 'General', value: `Total Commands: \`\ ${totalCommands} \`\ \nTotal Worked Shifts: \`\ ${shifts} \`\ \nCurrent job: \`\ ${currentJob} \`\ `, inline: true },
                    { name: 'Coins', value: `Balance: \`\ ${formattedCurrentBalance} \`\ \nNet: \`\ ${formattedNetBalance} \`\ `, inline: true },
                    { name: 'Gambling', value: `Total Lost: \`\ -${formattedAmountLost} \`\ \nTotal Won: \`\ ${formattedAmountWon} \`\ \nTotal Gained: \`\ ${formattedAmountGained} \`\ `, inline: false },
                );

            
            await interaction.reply({ embeds: [embed] });
        
    },
};

function formatBalance(balance) {
    if (balance >= 1e21) { // Sextillions
        return `${(balance / 1e21).toFixed(1)}S`;
    } else if (balance >= 1e18) { // Quintillions
        return `${(balance / 1e18).toFixed(1)}Qi`;
    } else if (balance >= 1e15) { // Quadrillions
        return `${(balance / 1e15).toFixed(1)}Q`;
    } else if (balance >= 1e12) { // Trillions
        return `${(balance / 1e12).toFixed(1)}T`;
    } else if (balance >= 1e9) { // Billions
        return `${(balance / 1e9).toFixed(1)}B`;
    } else if (balance >= 1e6) { // Millions
        return `${(balance / 1e6).toFixed(1)}M`;
    } else if (balance >= 1e3) { // Thousands
        return balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (balance <= -1e21) { // -Sextillions
        return `-${(balance / -1e21).toFixed(1)}S`;
    } else if (balance <= -1e18) { // -Quintillions
        return `-${(balance / -1e18).toFixed(1)}Qi`;
    } else if (balance <= -1e15) { // -Quadrillions
        return `-${(balance / -1e15).toFixed(1)}Q`;
    } else if (balance <= -1e12) { // -Trillions
        return `-${(balance / -1e12).toFixed(1)}T`;
    } else if (balance <= -1e9) { // -Billions
        return `-${(balance / -1e9).toFixed(1)}B`;
    } else if (balance <= -1e6) { // -Millions
        return `-${(balance / -1e6).toFixed(1)}M`;
    } else if (balance <= -1e3) { // -Thousands
        return balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return balance.toString();
    }
}