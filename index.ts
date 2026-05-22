import dotenv from 'dotenv';
import { Client, Emoji, GatewayIntentBits, Guild, GuildEmojiManager, Message, Partials, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { type Data } from './types.ts';

dotenv.config()

let data: Data
const filepath = './data.json';

try {
    const rawData = fs.readFileSync(filepath, 'utf8')
    data = JSON.parse(rawData) as Data;
} catch {
    console.error("failed to read json")
    data = {
        channels: { vannes: "", admin: "" },
        emojis: {
            valid: { id: "", name: "" },
            notValid: { id: "", name: "" }
        },
        minReactionNumber: 2
    };
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


// pour chaque reaction ajoutée
// check si on est pas dans le channel de vanne
// si oui check si c'est :harnein_valide:
// si oui check si le minimum de reaction est atteint
// si oui transfere le message dans le channel data.channels.vannes et y reagi avec :harnein_valide: et :harnein_valide_pas:
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
    if (message.channelId != data.channels.vannes)
        if (reaction.emoji.id == data.emojis.valid.id)
            if (reaction.count && reaction.count == data.minReactionNumber) {
                message.forward(data.channels.vannes);
                const channel = await client.channels.cache.get(data.channels.vannes) as TextChannel;
                // for (reaction.message.reactions)
                //     if (channel) channel.send()
            }
})


// ajoute les reactions aux messages transférés
client.on("messageCreate", async (message) => {

    if (message.channelId == data.channels.vannes) {
        try {
            await message.react(data.emojis.valid.id)
            await message.react(data.emojis.notValid.id)
            console.log(message)
        } catch {
            console.log("les emojis n'existent pas");
            if (data.channels.vannes != data.channels.admin) {
                const channel = client.channels.cache.get(data.channels.admin) as TextChannel;
                if (channel) channel.send("un ou plusieurs ids d'emoji sont mauvais");
            }
        }
    }

    if (message.channelId == data.channels.admin && !message.author.bot) {

        var commandStr = message.content
        if (!commandStr.startsWith("!")) return;
        const commandArray = commandStr.split(' ');

        if (commandArray[0] == "!set") {
            switch (commandArray[1]) {
                case "cv":
                case "channels.vannes":
                    console.log("changing vanne channel from " + data.channels.vannes + " to " + commandArray[2])
                    data.channels.vannes = commandArray[2];
                    break;

                case "ca":
                    data.channels.admin = commandArray[2]
                    break;

                case "ev":
                case "emojiValide":
                    var emojiArray = commandArray[2].split(':');
                    data.emojis.valid.name = emojiArray[1];
                    data.emojis.valid.id = emojiArray[2].slice(0, -1);
                    break;

                case "epv":
                case "emojiPasValide":
                    var emojiArray = commandArray[2].split(':');
                    data.emojis.notValid.name = emojiArray[1];
                    data.emojis.notValid.id = emojiArray[2].slice(0, -1)
                    break;

                case "min":
                case "mrc":
                case "minReactionNumber":
                    data.minReactionNumber = Number.parseInt(commandArray[2]);
                    break;
            }

            fs.writeFileSync(filepath, JSON.stringify(data))
            message.react("✅");
        }
        else if (commandArray[0] == "!get") {
            console.log("get command")
            message.reply(`infos:
    data.minReactionNumber: ${data.minReactionNumber}
    data.channels.vannes <#${data.channels.vannes}>
    data.channels.admin <#${data.channels.admin}>
    data.emojis.valid.id <:${data.emojis.valid.name}:${data.emojis.valid.id}>
    data.emojis.notValid.id <:${data.emojis.notValid.name}:${data.emojis.notValid.id}>
    `);
        }
        else if (commandArray[0] == "!help") {
            message.reply(`Commandes: 
    !set
      data.channels.vannes      [id] 
      data.channels.admin      [id]
      data.emojis.valid.id       [id]
      data.emojis.notValid.id    [id]
      data.minReactionNumber   [number]
                    `);
        }
        else {
            console.log(message);
        }
    }
});


client.login(process.env.DISCORD_TOKEN)
