const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const profileModel = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Shows Top 3 Richest Users"),
    async execute(interaction, profileData) {
        await interaction.deferReply();
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});

        const { globalName, id } = interaction.user;
        const { balance } = profileData;
        const emojiList = ["🥇", "🥈", "🥉"];

        let leaderboardEmbed = new EmbedBuilder()
            .setTitle("**🏆 Top 3 Richest Users**")
            .setColor(colorCodeBlue)
            .setFooter({ text: "You are not ranked yet", iconURL: interaction.user.avatarURL()});

        const members = await profileModel
            .find()
            .sort({ balance: -1 })
            .catch((err) => console.log(err))

        const memberIdx = members.findIndex((member) => member.userId === id);

        leaderboardEmbed.setFooter({ text: `${globalName}, you're rank #${memberIdx + 1} with ${balance}$`, iconURL: interaction.user.avatarURL()
        });

        const topThree = members.slice(0, 3);

        let desc = "";
        for(let i = 0; i < topThree.length; i++) {
            let {user} = await interaction.guild.members.fetch(topThree[i].userId);
            if (!user) return;
            let userBalance = topThree[i].balance;
            let formattedBalance = formatBalance(userBalance);
            desc += `**${emojiList[i]} ${user.globalName}:** ${formattedBalance} coins \n`;
        }
        if(desc !== "") {
            leaderboardEmbed.setDescription(desc);
        }

        await interaction.editReply({embeds: [leaderboardEmbed]});
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
    } else {
        return balance.toString();
    }
}
