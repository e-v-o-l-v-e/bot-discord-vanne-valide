import dotenv from 'dotenv';
import { Client, EmbedBuilder, GatewayIntentBits, Message, Partials, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { type GuildSettingsMap } from './types.ts';



// initialisation
dotenv.config()

let gsm: GuildSettingsMap;
const filepath = './guild.json';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.User
    ],
});

readSettings()



// helpers
function readSettings() {
    try {
        const rawData = fs.readFileSync(filepath, 'utf8')
        gsm = JSON.parse(rawData) as GuildSettingsMap;
    } catch {
        console.error("failed to read json")
    }
}

function writeSettings() {
    fs.writeFileSync(filepath, JSON.stringify(gsm, null, 2));
}

function getSettings(id: string) {
    if (!gsm) gsm = {};

    if (!gsm[id]) {
        gsm[id] = {
            channels: { vannes: "", admin: "", love: "" },
            emojis: {
                valid: { id: "", name: "" },
                notValid: { id: "", name: "" },
                loading: { id: "", name: "" }
            },
            minReactionNumber: 2,
        };
        writeSettings();
        readSettings();
    }
    return gsm[id];
}




// pour chaque reaction ajoutée
// check si on est ailleurs que dans le channel de vanne
// si oui check si c'est :harnein_valide:
// si oui check si le minimum de reaction est atteint
// si oui embed le message dans le channel guild.channels.vannes et y reagi avec :harnein_valide: et :harnein_valide_pas:
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
    if (!rm.guildId) return;
    const guildSettings = getSettings(rm.guildId);

    if (rm.channelId === guildSettings.channels.vannes) {

        if (reaction.count && reaction.count > 1) return;
        // check if the emoji is a number
        if (reaction.emoji.identifier.slice(1) !== '%EF%B8%8F%E2%83%A3') return;
        const loadingReaction = rm.react(guildSettings.emojis.loading.id)

        const prevEmbed = rm.embeds[0];
        if (!prevEmbed) {
            console.log("The message doesn't have an embed.");
            (await loadingReaction).remove();
            return;
        }

        const nContext = Number(reaction.emoji.identifier.charAt(0));
        let context = "";

        try {
            if (!prevEmbed.url) {
                console.log("url undefined");
                (await loadingReaction).remove()
                rm.react("❌")
                return;
            }

            const urlArray = prevEmbed.url.split('/');

            const originalMessageChannelId = urlArray[urlArray.length - 2];
            const originalMessageId = urlArray[urlArray.length - 1];

            if (!originalMessageChannelId) {
                console.log("originalMessageChannelId undefined");
                (await loadingReaction).remove()
                rm.react("❌")
                return;
            }
            if (!originalMessageId) {
                console.log("originalMessageId undefined");
                (await loadingReaction).remove()
                rm.react("❌")
                return;
            }

            const ogChannel = await client.channels.fetch(originalMessageChannelId) as TextChannel;
            const ogMessage = await ogChannel.messages.fetch(originalMessageId);
            const anchor = ogMessage.reference?.messageId ?? originalMessageId;
            const fetchedCollection = await ogChannel.messages.fetch({ before: anchor, limit: nContext });
            const fetchedMessages = Array.from(fetchedCollection.values());

            // loop from oldest to newest message
            fetchedMessages.reverse().forEach(element => {
                if (element.cleanContent) {
                    context += element.cleanContent + "\n";
                }
            });

        } catch (error) {
            console.error("Failed to fetch history:", error);
            (await loadingReaction).remove()
            rm.react("❌")
            return;
        }

        // update embed description
        const embed = EmbedBuilder.from(prevEmbed).setDescription((context || "No context text found.") + (prevEmbed.description ?? ""));
        await rm.edit({ embeds: [embed] });

        // remove the reaction
        try {
            // This deletes the entire emoji reaction instance from the message
            const checkReaction = await rm.react('✅')

            await reaction.remove();
            (await loadingReaction).remove();
            checkReaction.remove();
        } catch (error) {
            console.error("Failed to remove the reaction entirely:", error);
        }
        return;
    }

    // not valid emoji
    if (reaction.emoji.id == null) return; // default emojis don't have id
    if (reaction.emoji.id !== guildSettings.emojis.valid.id) return;

    if (reaction.count === guildSettings.minReactionNumber) {

        const sender = rm.guild?.members.cache.get(rm.author.id);

        let embed = new EmbedBuilder()
            // .setAuthor({
            //     name: sender?.displayName || "Utilisateur Inconnu",
            //     iconURL: sender?.displayAvatarURL() || rm.author.defaultAvatarURL
            // })
            .setTitle("super vanne de " + (sender?.displayName || "who knows"))
            .setURL(rm.url || "https://youtu.be/dQw4w9WgXcQ?si=y-vQVbG5aatub4mE")
            .setDescription("**" + (rm.cleanContent || "Qu'est-ce qui est jaune et qui attend ?") + "**")
            .setFooter({ text: "s'il y a un context tu peux juste réagir avec un emoji numero indiquant le nombre de message a recuperer" });

        if (rm.reference?.messageId) {
            let desc = (await rm.channel.messages.fetch(rm.reference.messageId)).cleanContent + "\n" + embed.data.description;
            embed = EmbedBuilder.from(embed).setDescription(desc);
        }

        const cv = await client.channels.fetch(guildSettings.channels.vannes) as TextChannel;
        await cv.send({ embeds: [embed] });
    }
});


// ajoute les reactions aux messages transférés
client.on("messageCreate", async (message) => {
    if (!message.guildId) return;
    const guildSettings = getSettings(message.guildId);

    if (message.channelId === guildSettings.channels.love) {
        await message.react("❤️");
        return;
    }

    if (message.channelId === guildSettings.channels.vannes) {
        try {
            await message.react(guildSettings.emojis.valid.id)
            await message.react(guildSettings.emojis.notValid.id)
        } catch {
            console.log("les emojis n'existent pas");
            if (guildSettings.channels.vannes !== guildSettings.channels.admin) {
                const channel = client.channels.cache.get(guildSettings.channels.admin) as TextChannel;
                if (channel) channel.send("un ou plusieurs ids d'emoji sont mauvais");
            }
        }
        return;
    }

    if (message.channelId === guildSettings.channels.admin && !message.author.bot) {

        let commandStr = message.content
        if (!commandStr.startsWith("!")) return;
        const commandArray = commandStr.split(' ');

        if (commandArray[0] === "!set") {
            switch (commandArray[1]) {
                case "cv":
                case "channels.vannes":
                    guildSettings.channels.vannes = commandArray[2].slice(2, -1);
                    break;

                case "ca":
                    guildSettings.channels.admin = commandArray[2].slice(2, -1);
                    break;

                case "cl":
                    guildSettings.channels.love = commandArray[2].slice(2, -1);
                    break;

                case "ev":
                case "emojiValide": {
                    const emojiArray = commandArray[2].split(':');
                    guildSettings.emojis.valid.name = emojiArray[1];
                    guildSettings.emojis.valid.id = emojiArray[2].slice(0, -1);
                    break;
                }

                case "epv":
                case "emojiPasValide": {
                    const emojiArray = commandArray[2].split(':');
                    guildSettings.emojis.notValid.name = emojiArray[1];
                    guildSettings.emojis.notValid.id = emojiArray[2].slice(0, -1);
                    break;
                }

                case "el":
                case "emojiLoading": {
                    try {
                        const emojiArray = commandArray[2].split(':');
                        guildSettings.emojis.loading.name = emojiArray[1];
                        guildSettings.emojis.loading.id = emojiArray[2].slice(0, -1);
                    } catch {
                        const emojiArray = commandArray[2].split(':');
                        guildSettings.emojis.loading.name = emojiArray[0]
                        guildSettings.emojis.loading.id = emojiArray[1]
                    }
                    break;
                }

                case "min":
                case "mrc":
                case "minReactionNumber":
                    guildSettings.minReactionNumber = Number.parseInt(commandArray[2]) || 2;
                    break;

                default:
                    return;
            }

            writeSettings()
            message.react("✅");
        }
        else if (commandArray[0] === "!get") {
            message.reply(`infos:
    guild.minReactionNumber (min, mrn): ${guildSettings.minReactionNumber}
    guild.channels.vannes (cv): <#${guildSettings.channels.vannes}>
    guild.channels.admin (ca): <#${guildSettings.channels.admin}>
    guild.channels.love (cl): <#${guildSettings.channels.love}>
    guild.emojis.valid.id (ev): <:${guildSettings.emojis.valid.name}:${guildSettings.emojis.valid.id}>
    guild.emojis.notValid.id (epv): <:${guildSettings.emojis.notValid.name}:${guildSettings.emojis.notValid.id}>
    guild.emojis.loading (el): <:${guildSettings.emojis.loading.name}:${guildSettings.emojis.loading.id}>
    `);
        }
        else if (commandArray[0] === "!help") {
            message.reply(`\`\`\`
Commandes:
!get                              affiche les paramètres actuels
!set <clé> <valeur>               modifie un paramètre et sauvegarde
  cv / channels.vannes            <#channel>
  ca                              <#channel>
  cl                              <#channel>
  ev / emojiValide                <:emoji:>
  epv / emojiPasValide            <:emoji:>
  el / emojiLoading               <:emoji:>
  min / mrc / minReactionNumber   <nombre>
!help                             affiche ce message
\`\`\``);
        }
    }
});


client.login(process.env.DISCORD_TOKEN)
