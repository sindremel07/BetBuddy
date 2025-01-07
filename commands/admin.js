const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Component } = require("discord.js");
const profileModel = require("../models/profileSchema");



module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("reset")
                .setDescription("Resets all users\' stats to the starting values")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("clear")
                .setDescription("Clears a specified number of messages")
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The number of messages to clear')
                        .setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("update")
                .setDescription("Update a user balance")
                .addUserOption((option) =>
                    option
                        .setName('user')
                        .setDescription('The user to update balance of')
                        .setRequired(true)
                )
                .addStringOption((option) => 
                    option
                        .setName("choice")
                        .setDescription("Add, Remove, or Set a balance for a user")
                        .setRequired(true)
                        .addChoices(
                            { name: "Add", value: "Add"},
                            { name: "Remove", value: "Remove"},
                            { name: "Set", value: "Set"},
                        ))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('The amount to change')
                        .setRequired(true)),
        ),
    async execute(interaction, profileData) {
        const allowedUserId = '798899079420575774';

        if(interaction.options.getSubcommand() === "reset") {
            if (interaction.user.id !== allowedUserId) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }
    
            try {
                await profileModel.updateMany({}, {
                    $set: {
                        balance: 50,
                        net: 50,
                        dailyLastUsed: 0,
                        hourlyLastUsed: 0,
                        rouletteLastUsed: 0,
                        shifts: 0,
                        currentJob: "none",
                        lastTimeWorked: 0,
                        totalCommands: 0,
                        inventory: null,
                        itemLastUsed: 0,
                        currentUsedItem: "none",
                        currentUsedItemDuration: 0,
                        amountWon: 0,
                        amountLost: 0,
                    }
                });
    
                interaction.reply('All user stats have been reset to their default values.');
            } catch (error) {
                console.error('Error resetting stats:', error);
                interaction.reply('There was an error resetting the stats.');
            }
        } else if(interaction.options.getSubcommand() === "clear") {
            const amount = interaction.options.getInteger('amount');
            await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});

            const allowedUserId = '798899079420575774';

            if (interaction.user.id !== allowedUserId) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: 'Please enter a number between 1 and 100.', ephemeral: true });
            }

            const messages = await interaction.channel.messages.fetch({ limit: amount });

            await interaction.channel.bulkDelete(messages, true)
                .then(deletedMessages => {
                    interaction.reply({ content: `Successfully deleted ${deletedMessages.size} messages.`, ephemeral: true });
                })
                .catch(err => {
                    console.error(err);
                    interaction.reply({ content: 'There was an error trying to delete messages in this channel!', ephemeral: true });
                });
        } else if(interaction.options.getSubcommand() === "update") {
            const updateUser = interaction.options.getUser('user');
            const choice = interaction.options.getString('choice');
            const amount = interaction.options.getInteger('amount');
            await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
            
            const { balance } = profileData;

            const allowedUserId = '798899079420575774';

            if (interaction.user.id !== allowedUserId) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            const userToUpdate = await profileModel.findOne({ userId: updateUser.id });

            if (!userToUpdate) {
                await interaction.deferReply({ ephemeral: true });
                return await interaction.editReply(`***${updateUser.globalName}*** is not in the currency system`);
            }

            if (choice === 'Add') {
                await profileModel.findOneAndUpdate(
                    { userId: updateUser.id },
                    { $inc: { balance: amount } },
                    { upsert: false }
                );
            } else if (choice === 'Remove') {
                await profileModel.findOneAndUpdate(
                    { userId: updateUser.id },
                    { $inc: { balance: -amount } },
                    { upsert: false }
                );
            } else if (choice === 'Set') {
                await profileModel.findOneAndUpdate(
                    { userId: updateUser.id },
                    { $set: { balance: amount }},
                    { upsert: false }
                );
            }

            await interaction.deferReply();
            return await interaction.editReply(`Successfully updated **${updateUser.globalName}**`);
        }


}};  