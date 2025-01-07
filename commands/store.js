const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const profileModel = require("../models/profileSchema");
const { items } = require("../models/items");
const { mysteryboxes } = require("../models/items");
const itemsList = require("../models/items");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("store")
        .setDescription("Buy items!")
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View what is available in the store!")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("buy")
                .setDescription("Buy something from the store")
                .addStringOption((option) => 
                    option
                        .setName("item")
                        .setDescription("Item to buy")
                        .setRequired(true)
                        .addChoices(...itemsList.items)
                        .addChoices(...itemsList.mysteryboxes)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("info")
                .setDescription("See info about an item")
                .addStringOption((option) => 
                    option
                        .setName("item")
                        .setDescription("Item to see info about")
                        .setRequired(true)
                        .addChoices(...itemsList.items)
                        .addChoices(...itemsList.mysteryboxes)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("sell")
                .setDescription("Sell an item from your inventory!")
                .addStringOption((option) => 
                    option
                        .setName("item")
                        .setDescription("Item to sell")
                        .setRequired(true)
                        .addChoices(...itemsList.items))
                    .addIntegerOption((option) => 
                    option
                        .setName("amount")
                        .setDescription("Amount of items to sell")
                        .setRequired(false)),
        ),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const { balance, inventory } = profileData;
        let inventoryArray = inventory;

        if(interaction.options.getSubcommand() === "view") {
            let viewType = "items"
            const itemsPerPage = 4; 
            let pages = []; 

            let currentPage = 0; 

            const generateEmbed = (page) => {
                let embed;
                if (viewType === "items") {
                    pages = []
                    for (let i = 0; i < itemsList.items.length; i += itemsPerPage) {
                        pages.push(itemsList.items.slice(i, i + itemsPerPage));
                    }

                    embed = new EmbedBuilder()
                        .setColor(colorCodeBlue)
                        .setTitle("Items Store")
                        .setDescription('Here are the available items:')
                        .setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                    pages[page].forEach(item => {
                        let emoji = item.cost > balance ? ":x:" : ":white_check_mark:";
                        embed.addFields({
                            name: `${emoji} ${item.value}`,
                            value: `- Value: \`\ ${item.cost.toLocaleString('en-US')}$ \`\ \n- Type: ${item.type} `
                        });
                    });
                } else if (viewType === "mysteryboxes") {
                    pages = []
                    for (let i = 0; i < itemsList.mysteryboxes.length; i += itemsPerPage) {
                        pages.push(itemsList.mysteryboxes.slice(i, i + itemsPerPage));
                    }

                    embed = new EmbedBuilder()
                            .setColor(colorCodeBlue)
                            .setTitle('Mystery Boxes Store')
                            .setDescription('Here are the available mystery boxes:')
                            .setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                    pages[page].forEach(item => {
                        let emoji = item.cost > balance ? ":x:" : ":white_check_mark:";
                        embed.addFields({
                            name: `${emoji} ${item.value}`,
                            value: `- Value: \`\ ${item.cost.toLocaleString('en-US')}$ \`\ \n- Type: ${item.type} \n- **Description: ** ${item.description} `
                        });
                    });
                }
    
                return embed;
            };

            const select = new StringSelectMenuBuilder()
                .setCustomId('types')
                .setPlaceholder('Change store type')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Items')
                        .setDescription('See the store for Items')
                        .setValue('items'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Mystery Boxes')
                        .setDescription('See the store for Mystery Boxes')
                        .setValue('mysteryboxes'),
                );

            const row = new ActionRowBuilder().addComponents(select);
            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages.length - 1)
                );

            await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [row, navigationRow] });

            const filter = i => ['previous', 'next', 'types'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, pages.length - 1);
                } else if (i.customId === 'types') {
                    if (i.values[0] === 'items') {
                        currentPage = 0; 
                        viewType = "items"
                    } else if (i.values[0] === 'mysteryboxes') {
                        currentPage = 0;
                        viewType = "mysteryboxes"
                    }
                }

                const newEmbed = generateEmbed(currentPage);
                const updatedRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === pages.length - 1)
                    );

                await i.update({ embeds: [newEmbed], components: [row, updatedRow] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'You did not select any options in time.', ephemeral: true });
                }
            });
        } else if(interaction.options.getSubcommand() === "buy") {
            const item = items.find(i => i.name === interaction.options.getString("item"));

            if(balance < item.cost) {
                await interaction.deferReply({ ephemeral: true });
                return await interaction.editReply(`You do not have **${item.cost.toLocaleString('en-US')}$** in your balance`);
            }

            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: -item.cost,
                    },
                    $push: {
                        inventory: item.name,
                    }
                }
            );

            await interaction.reply(`You bought ${item.name} for **${item.cost.toLocaleString('en-US')}$**`);
        } else if(interaction.options.getSubcommand() === "sell") {
            const item = items.find(i => i.name === interaction.options.getString("item"));
            const amount = interaction.options.getInteger("amount");
            const itemIndex = inventoryArray.indexOf(`${item.name}`);
            
            if(amount === 1 || !amount) {
                if (itemIndex !== -1) {
                    inventoryArray.splice(itemIndex, 1);
                    await interaction.reply(`You sold ${item.name} for **${item.cost.toLocaleString('en-US')}$**`);
                } else {
                    return await interaction.reply(`You dont have ${item.name} in your inventory..`);
                }
    
                await profileModel.findOneAndUpdate(
                    {
                        userId: interaction.user.id,
                    },
                    {
                        $inc: {
                            balance: item.cost,
                        },
                        $set: {
                            inventory: inventoryArray,
                        }
                    }
                );
            } else {
                if (itemIndex === -1) {
                    return await interaction.reply(`You dont have ${item.name} in your inventory..`);
                }
                for (let i = 0; i < amount; i++) {
                    const itemIndex = inventoryArray.indexOf(item.name);
                
                    if (itemIndex !== -1) {
                        inventoryArray.splice(itemIndex, 1);
                
                        await profileModel.findOneAndUpdate(
                            {
                                userId: interaction.user.id,
                            },
                            {
                                $inc: {
                                    balance: item.cost,
                                },
                                $set: {
                                    inventory: inventoryArray,
                                }
                            }
                        );
                    } else {
                        return await interaction.reply(`You sold ${i} ${item.name}'s for **${(item.cost * i).toLocaleString('en-US')}$**`);
                    }
                }
                await interaction.reply(`You sold ${amount} ${item.name}(s) for **${(item.cost * amount).toLocaleString('en-US')}$**`);                
            }
            
        } else if(interaction.options.getSubcommand() === "info") {
            const item = items.find(i => i.name === interaction.options.getString("item"));
            const mysterybox = mysteryboxes.find(i => i.name === interaction.options.getString("item"));

            if (mysterybox !== undefined) {
                let availableItems = "";

                mysterybox.containingItems.forEach(availableItem => {
                    availableItems = availableItems + `- ${availableItem.name}\n`;
                });

                const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setTitle(`${mysterybox.value}`)
                .setDescription(`${mysterybox.description}`)
                .addFields(
                    { name: 'Value', value: `${mysterybox.cost.toLocaleString('en-US')}$` },
                    { name: '\u200BItems you can get:', value: `${availableItems}` },
                )
                .setFooter({ text: `${mysterybox.type}` });

                await interaction.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setTitle(`${item.value}`)
                .setDescription(`${item.description}`)
                .addFields(
                    { name: 'Value', value: `${item.cost.toLocaleString('en-US')}$` },
                )
                .setFooter({ text: `${item.type}` });

                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
