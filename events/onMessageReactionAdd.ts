import * as Settings from '../settings.ts';
import { EmbedBuilder, Message, MessageReaction, type PartialMessageReaction, TextChannel } from 'discord.js';
import { client } from '../main.ts';


export async function onMessageReactionAdd(reaction: MessageReaction | PartialMessageReaction) {

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
}
