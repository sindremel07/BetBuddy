const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const User = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Start a blackjack game")
        .addIntegerOption(option => 
            option
                .setName('bet')
                .setDescription("Amount to bet")
                .setRequired(true)
                .setMinValue(1)),
    async execute (interaction, profileData) {
        await User.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        try {
            const { globalName } = interaction.user;

            const { balance, net, amountLost, amountWon } = profileData;

            const betAmount = interaction.options.getInteger('bet');
            if (balance < betAmount) {
                await interaction.deferReply({ ephemeral: true });
                return await interaction.editReply(`You do not have ${betAmount} coins in your balance`);
            }

            let deck = createDeck();
            let playerHand = [drawCard(deck), drawCard(deck)];
            let dealerHand = [drawCard(deck), drawCard(deck)];

            let playerTotal = calculateHand(playerHand);
            let dealerTotal = calculateHand(dealerHand);

            let embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setTitle("BlackJack")
                .setDescription("Hit - take another card\nStand - end the game\nDouble Down - double the bet, take one card, then end the game")
                .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                .addFields(
                    { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                    { name: 'Dealer Hand', value: `${formatHand([dealerHand[0]])}, ❓\nValue: ❓`, inline: true },
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hit')
                        .setLabel('Hit')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stand')
                        .setLabel('Stand')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('doubleDown')
                        .setLabel('Double Down')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({ embeds: [embed], components: [row] });

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                if (!i.isButton()) return;
                await i.deferUpdate();

                if(i.customId === 'hit') {
                    playerHand.push(drawCard(deck));
                    playerTotal = calculateHand(playerHand);

                    if (playerTotal > 21) {
                        await User.findOneAndUpdate(
                            {
                                userId: interaction.user.id,
                            },
                            {
                                $inc: {
                                    balance: -betAmount,
                                    amountLost: betAmount
                                },
                            }
                        );

                        embed = new EmbedBuilder()
                            .setColor(colorCodeRed)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                { name: '\u200B', value: `You lost -${betAmount}`, inline: false }
                            );
                        
                            const disableRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('hit')
                                    .setLabel('Hit')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('stand')
                                    .setLabel('Stand')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('doubleDown')
                                    .setLabel('Double Down')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        

                        await i.editReply({ embeds: [embed], components: [disableRow] });
                        collector.stop();
                    } else {
                        embed = new EmbedBuilder()
                            .setColor(colorCodeBlue)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand([dealerHand[0]])} ${formatHand([dealerHand[1]])}, ❓\nValue: ❓`, inline: true },
                            );
                        await i.editReply({ embeds: [embed ]});
                    }
                } else if (i.customId === 'stand') {
                    while (dealerTotal < 17) {
                        dealerHand.push(drawCard(deck));
                        dealerTotal = calculateHand(dealerHand);
                    }

                    if (dealerTotal > 21 || dealerTotal < playerTotal) {
                        await User.findOneAndUpdate(
                            {
                                userId: interaction.user.id,
                            },
                            {
                                $inc: {
                                    balance: betAmount,
                                    net: betAmount,
                                    amountWon: betAmount,
                                },
                            }
                        );

                        embed = new EmbedBuilder()
                            .setColor(colorCodeGreen)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                { name: '\u200B', value: `You won ${betAmount}$`, inline: false },
                            );
                    } else if (dealerTotal === playerTotal) {
                        embed = new EmbedBuilder()
                            .setColor(colorCodeBlue)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                { name: '\u200B', value: `Push, bet returned`, inline: false }
                            );
                    } else {
                        await User.findOneAndUpdate(
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

                        embed = new EmbedBuilder()
                            .setColor(colorCodeRed)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                { name: '\u200B', value: `You lost -${betAmount}`, inline: false }
                            );
                    }

                    const disableRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('hit')
                                .setLabel('Hit')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('stand')
                                .setLabel('Stand')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('doubleDown')
                                .setLabel('Double Down')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        );


                        await i.editReply({ embeds: [embed], components: [disableRow] })
                        collector.stop()

                } else if (i.customId === 'doubleDown') {
                    playerHand.push(drawCard(deck));
                    playerTotal = calculateHand(playerHand);

                    const loosingValue = (betAmount * 2)

                    if (playerTotal > 21) {
                        await User.findOneAndUpdate(
                            {
                                userId: interaction.user.id,
                            },
                            {
                                $inc: {
                                    balance: -loosingValue,
                                    amountLost: loosingValue,
                                },
                            }
                        );

                        embed = new EmbedBuilder()
                            .setColor(colorCodeRed)
                            .setTitle("BlackJack")
                            .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                            .addFields(
                                { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                { name: '\u200B', value: `You lost -${(loosingValue)}$`, inline: false }
                            );
                        
                        const disableRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('hit')
                                    .setLabel('Hit')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('stand')
                                    .setLabel('Stand')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('doubleDown')
                                    .setLabel('Double Down')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true)
                            );
                        

                        await i.editReply({ embeds: [embed], components: [disableRow] });
                        collector.stop();
                    } else {
                        while(dealerTotal < 17) {
                            dealerHand.push(drawCard(deck));
                            dealerTotal = calculateHand(dealerHand);
                        }
                

                        if (dealerTotal > 21 || playerTotal > dealerTotal) {
                            await User.findOneAndUpdate(
                                {
                                    userId: interaction.user.id,
                                },
                                {
                                    $inc: {
                                        balance: (betAmount * 2),
                                        net: (betAmount * 2),
                                        amountWon: (betAmount * 2),
                                    },
                                }
                            );

                            embed = new EmbedBuilder()
                                .setColor(colorCodeGreen)
                                .setTitle("BlackJack")
                                .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                                .addFields(
                                    { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `You won ${(betAmount * 2)}$`, inline: false }
                                );

                                const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );
                            

                            await i.editReply({ embeds: [embed], components: [disableRow]});
                            collector.stop();
                        } else if (dealerTotal > playerTotal) {
                            await User.findOneAndUpdate(
                                {
                                    userId: interaction.user.id,
                                },
                                {
                                    $inc: {
                                        balance: -loosingValue,
                                        amountLost: loosingValue,
                                    },
                                }
                            );
                            embed = new EmbedBuilder()
                                .setColor(colorCodeRed)
                                .setTitle("BlackJack")
                                .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                                .addFields(
                                    { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `You lost -${(betAmount * 2)}$`, inline: false }
                                );

                            const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );
                            

                            await i.editReply({ embeds: [embed], components: [disableRow]});
                            collector.stop();
                        } else {
                            embed = new EmbedBuilder()
                                .setColor(colorCodeBlue)
                                .setTitle("BlackJack")
                                .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                                .addFields(
                                    { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                                    { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                                    { name: '\u200B', value: `Push, bet returned`, inline: false }
                                );

                                const disableRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('hit')
                                        .setLabel('Hit')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('stand')
                                        .setLabel('Stand')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('doubleDown')
                                        .setLabel('Double Down')
                                        .setStyle(ButtonStyle.Success)
                                        .setDisabled(true)
                                );
                            

                            await i.editReply({ embeds: [embed], components: [disableRow]});
                            collector.stop();
                        }
                    }
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    const dealerTotal = calculateHand(dealerHand);
                    embed = new EmbedBuilder()
                        .setColor(colorCodeBlue)
                        .setTitle("BlackJack")
                        .setFooter({ text: `${globalName}`, iconURL: interaction.user.avatarURL()})
                        .setDescription("The game was cancelled due to inactivity.")
                        .addFields(
                            { name: 'Your Hand', value: `${formatHand(playerHand)}\nValue: ${playerTotal}`, inline: true },
                            { name: 'Dealer\'s Hand', value: `${formatHand(dealerHand)}\nValue: ${dealerTotal}`, inline: true },
                        );

                    const disableRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('hit')
                                .setLabel('Hit')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('stand')
                                .setLabel('Stand')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('doubleDown')
                                .setLabel('Double Down')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true)
                        );
                    

                    await interaction.reply({ embeds: [embed], components: [disableRow] });
                }
            });

        } catch(error) {
            console.log('Error:', error);
            await interaction.reply({ content: 'an error occoured' })
        }
        
    }
};

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }

    deck = shuffleDeck(deck);
    
    return deck;
}

function drawCard(deck) {
    const randomIndex = Math.floor(Math.random() * deck.length );
    const card = deck.splice(randomIndex, 1)[0];
    return card;
}

function calculateHand(hand) {
    let total = 0;
    let aces = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aces++;
            total += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            total += 10;
        } else {
            total += parseInt(card.value);
        }
    }

    while (total > 21 & aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function formatHand(hand) {
    return hand.map(card => `${card.value}${card.suit}`).join(', ');
}