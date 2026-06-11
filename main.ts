import dotenv from 'dotenv';
import { Client, EmbedBuilder, GatewayIntentBits, Guild, GuildManager, GuildMember, GuildMemberRoleManager, Message, Partials, PermissionFlagsBits, PermissionsBitField, TextChannel, User } from 'discord.js';
import * as Settings from './settings.ts';
import * as SlashManager from './slashManager.ts';



//-----------------
// INITIALISATION 
//-----------------

dotenv.config()

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

Settings.read();

await SlashManager.init();

client.login(process.env.DISCORD_TOKEN);



//------------
// PROCESSING
//------------

// slash commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.bot) return;
    if (!interaction.guildId) return;

    const member = interaction.member
    if (!member) return;

    const roles = member.roles as GuildMemberRoleManager;
    const botManagerRole = Settings.get(interaction.guildId).managerRole;
    if (!roles.cache.has(botManagerRole)) {
        if (!(member.permissions instanceof PermissionsBitField)) return;
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator)
        if (!isAdmin) {
            interaction.reply("haha t'as pas les perms espece de nul.")
            return;
        }
    }

    // console.log("commande reçu");
    SlashManager.execute(interaction);
})


// for every reactoin added
// check if it isn't in the joke channel
// if yes check if it's the valid emoji
// if yes check if there is enough reactions
// if yes embed the message in the "vannes" channel
// and react to it with (un)validation emojis
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
    const guildSettings = Settings.get(rm.guildId);

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


// add reactions to messages depending on the channel
client.on("messageCreate", async (message) => {
    if (!message.guildId) return;
    const guildSettings = Settings.get(message.guildId);

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
});



