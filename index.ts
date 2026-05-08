import dotenv from 'dotenv';
import { Client, Emoji, GatewayIntentBits, Guild, GuildEmojiManager, Message, Partials, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config()

// settings
var data
var jsonData

var vanneChannelId: string
var adminChannelId: string
var emojiValideId: string
var emojiPasValideId: string
var minReactionNumber: number

const filepath = './data.json';
try {
    data = fs.readFileSync(filepath, 'utf8')
    jsonData = JSON.parse(data);

    vanneChannelId = jsonData.vanneChannelId;
    adminChannelId = jsonData.adminChannelId;
    emojiValideId = jsonData.emojiValideId;
    emojiPasValideId = jsonData.emojiPasValideId;
    minReactionNumber = jsonData.minReactionNumber;
} catch {
    console.log("failed to read jsonData")
}


// initialisation
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User],
});


// pour chaque reaction ajouté
// check si on est pas dans le channel de vanne
// si oui check si c'est :harnein_valide:
// si oui check si le minimum de reaction est atteint
// si oui transfere le message dans le channel vanneChannelId et y reagi avec :harnein_valide: et :harnein_valide_pas:
client.on("messageReactionAdd", async (reaction) => {

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    // console.log(reaction)

    // pas un emoji specifique au serv
    if (reaction.emoji.id == null) {
        return;
    }

    // console.log(reaction.emoji.id);

    const message = reaction.message;
    if (message.channelId != vanneChannelId)
        if (reaction.emoji.id == emojiValideId)
            if (reaction.count && reaction.count == minReactionNumber)
                message.forward(vanneChannelId);
})


// ajoute les reactions aux messages transférés
client.on("messageCreate", async (message) => {

    if (message.channelId == vanneChannelId) {
        try {
            await message.react(emojiValideId)
            await message.react(emojiPasValideId)
        } catch {
            console.log("les emojis n'existent pas");
            if (vanneChannelId != adminChannelId) {
                const channel = client.channels.cache.get(adminChannelId);
                if (channel) channel.send("un ou plusieurs ids d'emoji sont mauvais");
            }
        }
    }

    if (message.channelId == adminChannelId && !message.author.bot) {

        var commandStr = message.cleanContent;
        if (!commandStr.startsWith("!")) return;
        const commandArray = commandStr.split(' ');

        if (commandArray[0] == "!set") {
            switch (commandArray[1]) {
                case "vanneChannelId":
                    message.reply("changing vanne channel from " + vanneChannelId + " to " + commandArray[2])
                    vanneChannelId = commandArray[2];
                    message.react("✅");
                    jsonData.vanneChannelId = vanneChannelId;

                case "adminChannelId":
                    adminChannelId = commandArray[2]

                case "emojiValideId":
                    emojiValideId = commandArray[2]
                    jsonData.emojiValideId = emojiValideId;

                case "emojiPasValideId":
                    emojiPasValideId = commandArray[2]
                    jsonData.emojiPasValideId = emojiPasValideId;

                case "minReactionNumber":
                    minReactionNumber = Number.parseInt(commandArray[2]);
                    jsonData.minReactionNumber = minReactionNumber;

                case '*':
                    data = JSON.stringify(jsonData)
                    fs.writeFileSync(filepath, data)
            }
        }
        else if (commandArray[0] == "!help") {
            message.reply(`Commandes:
          vanneChannelId      [id] 
          adminChannelId      [id]
          emojiValideId       [id]
          emojiPasValideId    [id]
          minReactionNumber   [number]
                    `);
        }
        else if (commandArray[0] == "!what") {
            console.log(message);
        }
    }
});


client.login(process.env.DISCORD_TOKEN)
