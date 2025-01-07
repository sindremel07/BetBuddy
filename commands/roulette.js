const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roulette")
        .setDescription("Bet on red or black")
        .addIntegerOption(option => 
            option
                .setName('bet')
                .setDescription("Amount to bet")
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const rouletteChoices = ["🔴", "⚫"];

        const {rouletteLastUsed} = profileData;

        const cooldown = 20000;
        const timeLeft = cooldown - (Date.now() - rouletteLastUsed);

        if(timeLeft > 0) {
            while (timeLeft > 0) {
                await interaction.deferReply({ ephermeral: true });
                const { seconds } = parseMilliseconds(timeLeft);
                return await interaction.editReply(`You can play roulette in ${seconds} sec`);
            }
        }

        try {
            const { balance } = profileData;
            const { globalName } = interaction.user;
            const betAmount = interaction.options.getInteger('bet');
            const winningAmount = (betAmount * 2);
        
            if (balance < betAmount) {
                await interaction.deferReply({ ephemeral: true });
                return await interaction.editReply(`You do not have ${betAmount} coins in your balance`);
            }

            await profileModel.findOneAndUpdate(
                {userId: interaction.user.id},
                {
                    $set: {
                        rouletteLastUsed: Date.now(),
                    }
                }
            );
            

            let embed = new EmbedBuilder()
                    .setColor(colorCodeBlue)
                    .setTitle("**Roulette Game**")
                    .setTimestamp() 
                    .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                    .addFields(
                        { name: '💰 Balance', value: `${formatBalance(balance)}$`, inline: true },
                        { name: '🪙 Bet amount', value: `${formatBalance(betAmount)}$`, inline: true },
                        { name: '\u200B\u200B', value: ` `, inline: false },
                        { name: '\u200B\u200B', value: `Correct guess pays 2:1`, inline: false },
                    );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('red')
                        .setLabel('🔴Red')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('black')
                        .setLabel('⚫Black')
                        .setStyle(ButtonStyle.Primary),
                );

            await interaction.reply({ embeds: [embed], components: [row] });

            
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async interaction => {
                if (!interaction.isButton()) return;
                await interaction.deferUpdate();
            
                if (interaction.customId === 'red') {
                    let correctChoice = randomChoice();
                    let isCorrect = false;

                    if (correctChoice === rouletteChoices[0]) {
                        isCorrect = true;
                        didUserWin(true, betAmount);
                    } else {
                        didUserWin(false, betAmount);
                    }

                    let embed = new EmbedBuilder()
                        .setColor(isCorrect ? "40b611" : "c70003")
                        .setTitle("**Roulette Game**")
                        .setTimestamp() 
                        .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                        .addFields(
                            { name: '💰 Balance', value: `${formatBalance(balance)}$`, inline: true },
                            { name: '🪙 Bet amount', value: `${formatBalance(betAmount)}$`, inline: true },
                            { name: '\u200B\u200B', value: `${correctChoice}`},
                            { name: '\u200B', value: isCorrect ? `You won **${formatBalance(winningAmount)}$**` : `You lost **-${formatBalance(betAmount)}$**`, inline: false },
                        );

                    const disableRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('red')
                                .setLabel('🔴Red')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('black')
                                .setLabel('⚫Black')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                        );

                    await interaction.editReply({ embeds: [embed], components: [disableRow] });
                    collector.stop();
                } else if (interaction.customId === 'black') {
                    let correctChoice = randomChoice();
                    let isCorrect = false;

                    if (correctChoice === rouletteChoices[1]) {
                        isCorrect = true;
                        didUserWin(true, betAmount);
                    } else {
                        didUserWin(false, betAmount);
                    }

                    let embed = new EmbedBuilder()
                        .setColor(isCorrect ? "40b611" : "c70003")
                        .setTitle("**Roulette Game**")
                        .setTimestamp() 
                        .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                        .addFields(
                            { name: '💰 Balance', value: `${formatBalance(balance)}$`, inline: true },
                            { name: '🪙 Bet amount', value: `${formatBalance(betAmount)}$`, inline: true },
                            { name: '\u200B\u200B', value: `${correctChoice}`},
                            { name: '\u200B', value: isCorrect ? `You won **${formatBalance(winningAmount)}$**` : `You lost **-${formatBalance(betAmount)}$**`, inline: false },
                        );

                    const disableRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('red')
                                .setLabel('🔴Red')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('black')
                                .setLabel('⚫Black')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                        );

                    await interaction.editReply({ embeds: [embed], components: [disableRow] });
                    collector.stop();
                }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                embed = new EmbedBuilder()
                    .setColor(colorCodeBlue)
                    .setTitle("Roulette")
                    .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                    .setDescription("The game was cancelled due to inactivity.")

                const disableRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('red')
                            .setLabel('🔴Red')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('black')
                            .setLabel('⚫Black')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                    );
                

                await interaction.reply({ embeds: [embed], components: [disableRow] });
            }
        });

    } catch(error) {
        console.log('Error:', error);
        await interaction.reply({ content: 'an error occoured' })
    };

    function randomChoice() {
        let choice = rouletteChoices[(Math.floor(Math.random() * rouletteChoices.length))]
        
        return choice;
    };

    async function didUserWin(userWin, betAmount) {
        let winningAmount = (betAmount * 2);
        if (userWin === false) {
            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: -betAmount,
                        amountLost: betAmount,
                    },
                }
            );
        } else {
            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: winningAmount,
                        net: winningAmount,
                        amountLost: winningAmount,
                    },
                }
            );
        }
    };
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