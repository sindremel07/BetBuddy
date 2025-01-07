const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");
const parseMilliseconds = require("parse-ms-2");
const { items } = require("../models/items");
const itemsList = require("../models/items");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("Check your inventory!")
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View your inventory")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("use")
                .setDescription("Use and item in your inventory")
                .addStringOption((option) => 
                    option
                        .setName("item")
                        .setDescription("Item to use")
                        .setRequired(true)
                        .addChoices(...itemsList.items)
                        .addChoices(...itemsList.mysteryboxes)),
        ),
    async execute(interaction, profileData) {
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        const username = interaction.user.globalName;
        const { inventory, currentUsedItem, itemLastUsed, currentUsedItemDuration } = profileData;
        let inventoryArray = inventory;

        let timeLeft = currentUsedItemDuration - (Date.now() - itemLastUsed);

        if (timeLeft <= 0) {
            buffEffect = 1;
            await profileModel.findOneAndUpdate(
                {userId: interaction.user.id},
                {
                    $set: {
                        currentUsedItemDuration: 0,
                        currentUsedItem: "none",
                        itemLastUsed: 0,
                    },
                }
            );
        }

        if(interaction.options.getSubcommand() === "view") {
            const embed = new EmbedBuilder()
                .setColor(colorCodeBlue)
                .setAuthor({ name: `${username}\`s inventory`, iconURL: interaction.user.avatarURL()})
                .setFooter({ text: `Page 1 of 1` });

            const itemCounts = {};
            
            inventory.forEach(itemName => {
                if (itemCounts[itemName]) {
                    itemCounts[itemName]++;
                } else {
                    itemCounts[itemName] = 1;
                }
            });
        
            for (let itemName in itemCounts) {
                const item = items.find(i => i.name === itemName);
                if (item) {
                    const itemsAmt = itemCounts[itemName];
        
                    embed.addFields({
                        name: `${item.name} - ${itemsAmt}`,
                        value: `- ${item.type} \n- Value: \`${item.cost.toLocaleString('en-US')}$\``
                    });
                }
            }
            
            await interaction.reply({ embeds: [embed] });
        } else if(interaction.options.getSubcommand() === "use") {
            const item = items.find(i => i.name === interaction.options.getString("item"));
            const itemIndex = inventoryArray.indexOf(`${item.name}`);

            let timeLeft = currentUsedItemDuration - (Date.now() - itemLastUsed);

            if (itemIndex === -1) {
                return await interaction.reply(`You dont have ${item.name} in your inventory..`);
            } else if (item.type === "Collectable") {
                return await interaction.reply(`**${item.name}** is an Collectable`);
            } else if (item.type !== "Buff") {
                inventoryArray.splice(itemIndex, 1);
                await profileModel.findOneAndUpdate(
                    {userId: interaction.user.id},
                    {
                        $set: {
                            inventory: inventoryArray,
                        }
                    }
                );
                return await interaction.reply(`You used ${item.name}`);
            } else if (item.name === currentUsedItem){
                inventoryArray.splice(itemIndex, 1);
                await profileModel.findOneAndUpdate(
                    {userId: interaction.user.id},
                    {
                        $inc: {
                            currentUsedItemDuration: item.duration,
                        },
                        $set: {
                            inventory: inventoryArray,
                        }
                    }
                );

                const { days, hours, minutes, seconds } = parseMilliseconds(timeLeft);

                return await interaction.reply(`You used **${item.name}** and it is *${days} days ${hours} hrs ${minutes} min ${seconds} sec* left of the item effect`);
            } else if(timeLeft > 0) {
                const { days, hours, minutes, seconds } = parseMilliseconds(timeLeft);
                return await interaction.reply(`You can use a new item in *${days} days ${hours} hrs ${minutes} min ${seconds} sec*`);
            }  else if (item.name === "none" || timeLeft <= 0) {
                inventoryArray.splice(itemIndex, 1);
                
                await profileModel.findOneAndUpdate(
                    {userId: interaction.user.id},
                    {
                        $set: {
                            currentUsedItemDuration: item.duration,
                            currentUsedItem: item.name,
                            itemLastUsed: Date.now(),
                            inventory: inventoryArray,
                        },
                    }
                );

                const { days, hours, minutes, seconds } = parseMilliseconds((currentUsedItemDuration + item.duration));

                return await interaction.reply(`You used **${item.name}** and it is *${days} days ${hours} hrs ${minutes} min ${seconds} sec* left of the item effect`);
            }    
            
        } 
    },
};
