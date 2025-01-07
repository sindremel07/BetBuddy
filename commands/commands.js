const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("commands")
        .setDescription("Shows all commands"),
    async execute(interaction) {
        const username = interaction.user.globalName;

        const embed = new EmbedBuilder()
            .setColor(colorCodeBlue) // Set the color of the embed
            .setTitle("Commands")
            .setDescription("Here is all the current available commands")
            .setTimestamp() 
            .setFooter({ text: username, iconURL: interaction.user.avatarURL() })
            .addFields(
                { name: '**General Commands**', value: '/effect \n/store \n/inventory \n/profile \n/balance \n/leaderboard \n/daily \n/hourly \n/donate \n/ping', inline: true},
                { name: '**Gambling Commands**', value: '/coinflip \n/blackjack \n/roulette', inline: true },
                { name: '**Work Commands**', value: '/work apply \n/work list \n/work shift \n/work resign', inline: true},
            )

        await interaction.reply({ embeds: [embed] });
    },
};
