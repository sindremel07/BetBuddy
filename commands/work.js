const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Component } = require("discord.js");
const choices = require("../models/choices");
const { items } = require("../models/items");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { colorCodeGreen, colorCodeRed, colorCodeBlue } = require("../globalValues.json");

const emojis = [
    "😀", "😁", "😂", "🤣", "😊", "😇", "🥰", "😍", "🤩", "😘",
    "😗", "😙", "😚", "😋", "😎", "🤓", "🧐", "😕", "😟",
    "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰",
    "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫",
    "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡",
    "👹", "👺", "🙈", "🙉", "🙊", "👋", "🤚", "🖐", "✋",
    "🖖", "👂", "👌", "🤌", "🤏", "✌️", "🤞", "🤝", "🙏", "👍",
    "👎", "👊", "🤛", "🤜", "🤚", "🖐", "✋", "✌️", "🤞", "🤝",
    "👏", "🙌", "👐", "🤲", "🤝", "🙏", "🤘", "🤙", "👋", "🤚"
  ];

let shuffledEmojiList = [];


module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Work related commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("apply")
                .setDescription("Apply for work")
                .addStringOption((option) => 
                    option
                        .setName("job")
                        .setDescription("Apply for a job.")
                        .setRequired(true)
                        .addChoices(...choices.jobs)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("shift")
                .setDescription("Work a shift"),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("resign")
                .setDescription("Resign from your current job"),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all current jobs"),
        ),
    async execute(interaction, profileData) {
        const { shifts, currentJob, lastTimeWorked, itemLastUsed, currentUsedItemDuration, currentUsedItem } = profileData;
        await profileModel.findOneAndUpdate({userId: interaction.user.id,},{$inc: {totalCommands: 1},});
        let buffEffect = 1;
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
        } else {
            const item = items.find(i => i.name === currentUsedItem);
            buffEffect = item.buffeffect;
        }

        if(interaction.options.getSubcommand() === "apply") {
            const choice = interaction.options.getString("job");
            const selectedJob = choices.jobs.find(job => job.name === choice);
            
            if (currentJob !== "none") {
                return await interaction.reply(`You already have a job, resign from it if you want to apply for this one.`);
            }

            if (selectedJob.shiftsToUnlock > shifts) {
                return await interaction.reply(`You need to work ${selectedJob.shiftsToUnlock} shifts to apply for this job...`);
            }

            

            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $set: {
                        currentJob: choice,
                    },
                }
            );  

            return await interaction.reply(`You are now working as a ${selectedJob.name}`);
        } 
        
        else if(interaction.options.getSubcommand() === "shift") {

            if (currentJob === "none") {
                return await interaction.reply(`You don't have a job, apply for a job to take a shift.`);
            }
            
        const cooldown = 1800000 * buffEffect;
        const timeLeft = cooldown - (Date.now() - lastTimeWorked);

        if(timeLeft > 0) {
            await interaction.deferReply({ ephermeral: true });
            const { minutes, seconds } = parseMilliseconds(timeLeft);
            return await interaction.editReply(`You can work in ** ${minutes} **min** ${seconds} **sec`);
        } 
            

            const randomEmoji = randomChoice();

            let embed = new EmbedBuilder()
                    .setColor(colorCodeBlue)
                    .setTitle("**Job Shift**")
                    .setFooter({ text: `Working as a ${currentJob}`})
                    .addFields(
                        { name: `${randomEmoji}`, value: `\u200B\u200BLook closely at the emoji`},
                    );

            await interaction.reply({ embeds: [embed] });

            setTimeout(() => {
                showTask(interaction, randomEmoji, currentJob)
            }, 3000)

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });
            const userJob = choices.jobs.find(job => job.name === currentJob);
            

            collector.on('collect', async i => { 
                if (!i.isButton()) return;
                await i.deferUpdate();

                if(i.customId === `${randomEmoji}`) { 
                    embed = new EmbedBuilder()
                        .setColor(colorCodeGreen)
                        .setTitle("**Great Work**")
                        .setFooter({ text: `Working as a ${currentJob}` })
                        .addFields(
                            { name: 'You were given:', value: `> ${(userJob.salary).toLocaleString('en-US')}$ for your shift`}
                        );
                
                    let disableRow1 = new ActionRowBuilder();
                    let disableRow2 = new ActionRowBuilder();

                    let isCorrectEmoji = false;
                
                    shuffledEmojiList.forEach((emoji, index) => {
                        if (emoji === randomEmoji) {
                            isCorrectEmoji = true
                        } else {
                            isCorrectEmoji = false
                        }
                        let button = new ButtonBuilder()
                            .setCustomId(`${emoji}`)
                            .setLabel(`${emoji}`)
                            .setStyle(isCorrectEmoji ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(true);
                
                        if (index < 4) {
                            disableRow1.addComponents(button);
                        } else {
                            disableRow2.addComponents(button);
                        }
                    });

                    await profileModel.findOneAndUpdate(
                        {
                            userId: interaction.user.id,
                        },
                        {
                            $inc: {
                                balance: userJob.salary,
                                net: userJob.salary,
                            },
                        }
                    );
                
                    await interaction.editReply({ embeds: [embed], components: [disableRow1, disableRow2] });
                    collector.stop();
                } else {
                    embed = new EmbedBuilder()
                        .setColor(colorCodeRed)
                        .setTitle("Ehhh, you can do better...")
                        .setFooter({ text: `Working as a ${currentJob}` })
                        .addFields(
                            { name: 'Awful work, you were given:', value: `> ${((userJob.salary / 4).toFixed()).toLocaleString('en-US')}$`}
                        );
                
                    let disableRow1 = new ActionRowBuilder();
                    let disableRow2 = new ActionRowBuilder();
                
                    shuffledEmojiList.forEach((emoji, index) => {
                        let button = new ButtonBuilder()
                            .setCustomId(`${emoji}`)
                            .setLabel(`${emoji}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);
                
                        if (index < 4) {
                            disableRow1.addComponents(button);
                        } else {
                            disableRow2.addComponents(button);
                        }
                    });

                    await profileModel.findOneAndUpdate(
                        {
                            userId: interaction.user.id,
                        },
                        {
                            $inc: {
                                balance: (userJob.salary / 4).toFixed(1),
                                net: (userJob.salary / 4).toFixed(1),
                            },
                        }
                    );
                
                    await interaction.editReply({ embeds: [embed], components: [disableRow1, disableRow2] });
                    collector.stop();
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    embed = new EmbedBuilder()
                        .setColor(colorCodeBlue)
                        .setTitle("**Job Shift**")
                        .setFooter({ text: `Working as a ${currentJob}` })
                        .setDescription("The game was cancelled due to inactivity.")
                        .addFields(
                            { name: 'Uh-oh', value: '> You don\'t get paid for this shift...'}
                        );
                
                    let disableRow1 = new ActionRowBuilder();
                    let disableRow2 = new ActionRowBuilder();
                
                    shuffledEmojiList.forEach((emoji, index) => {
                        let button = new ButtonBuilder()
                            .setCustomId(`${emoji}`)
                            .setLabel(`${emoji}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true);
                
                        if (index < 4) {
                            disableRow1.addComponents(button);
                        } else {
                            disableRow2.addComponents(button);
                        }
                    });
                
                    await interaction.editReply({ embeds: [embed], components: [disableRow1, disableRow2] });
                }
            });



            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        shifts: 1,
                    },
                    $set: {
                        lastTimeWorked: Date.now(),
                    },
                }
            );  
        }

        else if(interaction.options.getSubcommand() === "resign") {

            if (currentJob === "none") {
                return await interaction.reply(`You don't have a job to resign from`);
            }
            
            await interaction.reply(`You resigned from ${currentJob}`);

            await profileModel.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $set: {
                        currentJob: "none",
                    },
                }
            );   
            
        }

        else if (interaction.options.getSubcommand() === "list") {
            const jobsPerPage = 5;
            let currentPage = 0;
        
            const generateEmbed = (page) => {
                const embed = new EmbedBuilder()
                    .setColor(colorCodeBlue)
                    .setTitle("Available Jobs")
                    .setDescription("Jobs with :x: next to them are locked");
        
                const start = page * jobsPerPage;
                const end = start + jobsPerPage;
                const jobsOnPage = choices.jobs.slice(start, end);
        
                jobsOnPage.forEach(job => {
                    let emoji = "";
        
                    if (job.shiftsToUnlock > shifts) {
                        emoji = ":x:";
                    } else if (job.shiftsToUnlock <= shifts) {
                        emoji = ":white_check_mark:";
                    }
        
                    embed.addFields({
                        name: `${emoji} ${job.name}`,
                        value: `- Salary: \`\ ${job.salary.toLocaleString('en-US')} \`\ \n- Shifts to Unlock: \`\ ${job.shiftsToUnlock} \`\ `
                    });
                });
        
                embed.setFooter({ text: `Page ${page + 1} of ${Math.ceil(choices.jobs.length / jobsPerPage)}` });
                return embed;
            };
        
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true), 
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(choices.jobs.length <= jobsPerPage) 
                );
        
            const message = await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: [row],
                fetchReply: true
            });
        
            const filter = i => i.user.id === interaction.user.id;
            const collector = message.createMessageComponentCollector({
                filter,
                time: 60000 
            });
        
            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.customId === 'prev') {
                    currentPage--;
                } else if (btnInteraction.customId === 'next') {
                    currentPage++;
                }
        
                await btnInteraction.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0), 
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage >= Math.ceil(choices.jobs.length / jobsPerPage) - 1) 
                        )
                    ]
                });
            });
        
            collector.on('end', () => {
                message.edit({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        )
                    ]
                });
            });
        }
    },
};

function randomChoice() {
    const choice = emojis[(Math.floor(Math.random() * emojis.length))]
    
    return choice;
};

async function showTask(interaction, correctEmoji, currentJob) {
    let emojiList = [correctEmoji];

    while (emojiList.length < 8) {
        let choice = emojis[Math.floor(Math.random() * emojis.length)];
        if (!emojiList.includes(choice)) {
            emojiList.push(choice);
        }
    }

    emojiList = emojiList.sort(() => Math.random() - 0.5);
    shuffledEmojiList = emojiList

    const embed = new EmbedBuilder()
        .setColor(colorCodeBlue)
        .setTitle("**Job Shift**")
        .setFooter({ text: `Working as a ${currentJob}` })
        .addFields(
            { name: `Choose the correct emoji`, value: " " }
        );

    let row1 = new ActionRowBuilder();
    let row2 = new ActionRowBuilder();

    emojiList.forEach((emoji, index) => {
        let button = new ButtonBuilder()
            .setCustomId(`${emoji}`)
            .setLabel(`${emoji}`)
            .setStyle(ButtonStyle.Secondary);

        if (index < 4) {
            row1.addComponents(button);
        } else {
            row2.addComponents(button);
        }
    });

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
}