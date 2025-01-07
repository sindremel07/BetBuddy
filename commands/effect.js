const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");
const parseMilliseconds = require("parse-ms-2");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("effect")
        .setDescription("Effect commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("timeleft")
                .setDescription("Check time left for current effect")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove current effect")
        ),
    async execute(interaction, profileData) {
        const { currentUsedItem, currentUsedItemDuration, itemLastUsed } = profileData
        if(interaction.options.getSubcommand() === "timeleft") {
            timeLeft = currentUsedItemDuration - (Date.now() - itemLastUsed);
            const { days, hours, minutes, seconds } = parseMilliseconds(timeLeft);

            if (currentUsedItem === "none") {
                return interaction.reply(`Currently using no effect`)
            } else {
                return interaction.reply(`Currently using **${currentUsedItem}** and it is *${days} days ${hours} hrs ${minutes} min ${seconds} sec* left of the item effect`)
            }
        } else if(interaction.options.getSubcommand() === "remove") {
            const confirmationEmbed = new EmbedBuilder()
                .setColor('#2C2F33')
                .setTitle('Are you sure?')
                .setDescription(`Are you sure you want to remove the effect **${currentUsedItem}?**`)
        
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_no')
                        .setLabel('Cancel')
                        .setStyle('Danger'),
                    new ButtonBuilder()
                        .setCustomId('confirm_yes')
                        .setLabel('Confirm')
                        .setStyle('Success')
                );
        
            await interaction.reply({
                embeds: [confirmationEmbed],
                components: [row],
            });
        
            const filter = (buttonInteraction) => {
                return buttonInteraction.user.id === interaction.user.id;
            };
        
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 15000,
            });
        
            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.customId === 'confirm_yes') {
                    await profileModel.findOneAndUpdate(
                        { userId: interaction.user.id },
                        {
                            $set: {
                                currentUsedItemDuration: 0,
                                currentUsedItem: "none",
                                itemLastUsed: 0,
                            },
                        }
                    );
        
                    await buttonInteraction.update({
                        content: `Effect **${currentUsedItem}** has been removed.`,
                        embeds: [],
                        components: []
                    });
                } else if (buttonInteraction.customId === 'confirm_no') {
                    await buttonInteraction.update({
                        content: 'Effect removal cancelled.',
                        embeds: [],
                        components: []
                    });
                }
            });
        
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: 'No response received. Effect removal cancelled.',
                        embeds: [],
                        components: []
                    });
                }
            });
        }

    },
};
