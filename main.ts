import dotenv from 'dotenv';
import { Client, Collection, Embed, EmbedBuilder, Emoji, GatewayIntentBits, Guild, GuildEmojiManager, GuildMember, Message, messageLink, Partials, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { type Data } from './types.ts';
import { channel } from 'diagnostics_channel';

dotenv.config()

let data: Data
const filepath = './data.json';

try {
    const rawData = fs.readFileSync(filepath, 'utf8')
    data = JSON.parse(rawData) as Data;
} catch {
    console.error("failed to read json")
    data = {
        channels: { vannes: "", admin: "", love: "" },
        emojis: {
            valid: { id: "", name: "" },
            notValid: { id: "", name: "" },
            loading: { id: "", name: "" }
        },
        minReactionNumber: 2,
        embeds: []
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
            console.error('Something went wrong when fetching the reaction:', error);
            return;
        }
    }
    if (reaction.message.partial) {
        try {
            await reaction.message.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the partial message:', error);
            return;
        }
    }

    const rm = reaction.message as Message;

    const cv = client.channels.cache.get(data.channels.vannes) as TextChannel;
    const sender = rm.guild?.members.cache.get(rm.author?.id);

    if (rm.channelId === data.channels.vannes) {

        if (reaction.count && reaction.count > 1) return;
        // check if the emoji is a number
        if (reaction.emoji.identifier.slice(1) !== '%EF%B8%8F%E2%83%A3') return;
        const loadingReaction = rm.react(data.emojis.loading.id)

        const prevEmbed = rm.embeds[0];
        if (!prevEmbed) {
            console.log("The message doesn't have an embed.");
            return;
        }

        const nContext = Number(reaction.emoji.identifier.charAt(0));
        let context = "";

        console.log("\nwaiting for messages...");

        try {
            if (!prevEmbed.url) {
                console.log("url undefined")
                return;
            }

            const urlArray = prevEmbed.url.split('/');

            const originalMessageChannelId = urlArray[urlArray.length - 2];
            const originalMessageId = urlArray[urlArray.length - 1];
            const originalMessageChannel = client.channels.cache.get(originalMessageChannelId) as TextChannel;

            if (!originalMessageChannelId) {
                console.log("originalMessageChannelId undefined");
                return;
            }
            if (!originalMessageId) {
                console.log("originalMessageId undefined");
                return;
            }

            const fetchedCollection = await originalMessageChannel.messages.fetch({ before: originalMessageId, limit: nContext });
            const fetchedMessages = Array.from(fetchedCollection.values());

            // loop from oldest to newest message
            fetchedMessages.reverse().forEach(element => {
                if (element.cleanContent) {
                    context += element.cleanContent + "\n";
                }
            });

        } catch (error) {
            console.error("Failed to fetch history:", error);
        }

        console.log("nContext: " + nContext + ".\ncontext:\n" + context);

        // update embed description
        const embed = EmbedBuilder.from(prevEmbed).setDescription(context || "No context text found.");
        await rm.edit({ embeds: [embed] });

        // remove the reaction
        try {
            // This deletes the entire emoji reaction instance from the message
            const checkReaction = await rm.react('✅')

            await reaction.remove();

            (await loadingReaction).remove()
            // (await checkReaction).remove()
        } catch (error) {
            console.error("Failed to remove the reaction entirely:", error);
        }
    }

    // not valid emoji
    if (reaction.emoji.id == null) return; // default emojis don't have id
    if (reaction.emoji.id !== data.emojis.valid.id) return;

    if (reaction.count && reaction.count === data.minReactionNumber) {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: sender?.displayName || "Utilisateur Inconnu",
                iconURL: sender?.displayAvatarURL() || rm.author.defaultAvatarURL
            })
            .setURL(rm.url || "https://youtu.be/dQw4w9WgXcQ?si=y-vQVbG5aatub4mE")
            .setTitle(rm.cleanContent || "Qu'est-ce qui est jaune et qui attend ?");

        await cv.send({ embeds: [embed] });
    }

});


// ajoute les reactions aux messages transférés
client.on("messageCreate", async (message) => {

    if (message.channelId == data.channels.vannes) {
        try {
            await message.react(data.emojis.valid.id)
            await message.react(data.emojis.notValid.id)
        } catch {
            console.log("les emojis n'existent pas");
            if (data.channels.vannes != data.channels.admin) {
                const channel = client.channels.cache.get(data.channels.admin) as TextChannel;
                if (channel) channel.send("un ou plusieurs ids d'emoji sont mauvais");
            }
        }
        return;
    }

    if (message.channelId == data.channels.love) {
        message.react("❤️")
    }

    if (message.channelId == data.channels.admin && !message.author.bot) {

        var commandStr = message.content
        if (!commandStr.startsWith("!")) return;
        const commandArray = commandStr.split(' ');

        if (commandArray[0] == "!set") {
            switch (commandArray[1]) {
                case "cv":
                case "channels.vannes":
                    // console.log("changing vanne channel from " + data.channels.vannes + " to " + commandArray[2])
                    data.channels.vannes = commandArray[2].slice(2, -1);
                    break;

                case "ca":
                    data.channels.admin = commandArray[2].slice(2, -1);
                    break;

                case "cl":
                    data.channels.love = commandArray[2].slice(2, -1);
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

                case "el":
                case "emojiLoading":
                    var emojiArray = commandArray[2].split(':');
                    data.emojis.loading.name = emojiArray[1];
                    data.emojis.loading.id = emojiArray[2].slice(0, -1);
                    break;

                case "min":
                case "mrc":
                case "minReactionNumber":
                    data.minReactionNumber = Number.parseInt(commandArray[2]);
                    break;
            }

            fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
            message.react("✅");
        }
        else if (commandArray[0] == "!get") {
            console.log("get command")
            message.reply(`infos:
    data.minReactionNumber (min, mrn): ${data.minReactionNumber}
    data.channels.vannes (cv): <#${data.channels.vannes}>
    data.channels.admin (ca): <#${data.channels.admin}>
    data.channels.love (ca): <#${data.channels.love}>
    data.emojis.valid.id (ev): <:${data.emojis.valid.name}:${data.emojis.valid.id}>
    data.emojis.notValid.id (epv): <:${data.emojis.notValid.name}:${data.emojis.notValid.id}>
    data.emojis.loading (el): <:${data.emojis.loading.name}:${data.emojis.loading.id}>
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
