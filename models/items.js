module.exports = {
    items: [
        {
            name: "Apple",
            value: "Apple",
            description: "> It's an apple.. you eat it.", // later it will give 1.3x money boost
            type: "Consumable", // later it will be common buff
            cost: 100,
        },
        {
            name: "Alcohol",
            value: "Alcohol",
            description: "> You drink this to feel *better*",
            type: "Consumable",
            cost: 10000
        },
        {
            name: "Kebab",
            value: "Kebab",
            description: "> Eating this will half the work cooldown for 24hrs",
            type: "Buff",
            buffeffect: 0.5,
            duration: 86400000,
            cost: 50000,
        },
        { 
            name: "Ryan Renolds Bath Water",
            value: "Ryan Renolds Bath Water", 
            description: "> Water that Ryan Renolds has bathed in",
            type: "Collectable",
            cost: 500000,
        },
        {
            name: "Engagement Ring",
            value: "Engagement Ring",
            description: "> You feel extra connected to someone in the server? Use this to propose to them, and if they say yes, you are married!",
            type: "Collectable",
            cost: 5000000,
        },
        { 
            name: "Golden Dildo",
            value: "Golden Dildo", 
            description: "> I think you know what this is used for...",
            type: "Collectable",
            cost: 10000000,
        },
    ],
    mysteryboxes: [
        {
            name: "Box of Secrets",
            value: "Box of Secrets",
            type: "Mystery Box",
            description: "> For the low price of **100,000$** you can win *AMAZING* items! \n> */store info boxofsecrets* for items you can get",
            cost: 100000,
            containingItems: [
                { 
                    name: "Ryan Renolds Bath Water"
                },
                {
                    name: "Money",
                    lowestAmount: 50000,
                    highestAmount: 120000,
                },
                {
                    name: "Apple",
                },
                {
                    name: "Alcohol",
                },
                {
                    name: "Kebab",
                }
            ]
        },
    ]
};