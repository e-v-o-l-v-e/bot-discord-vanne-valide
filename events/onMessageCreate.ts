import * as Settings from '../settings.ts';
import { client } from '../main.ts';
import { Message, TextChannel } from 'discord.js';


// for every reaction added
// check if it isn't in the joke channel
// if yes check if it's the valid emoji
// if yes check if there is enough reactions
// if yes embed the message in the "vannes" channel
// and react to it with (un)validation emojis
export async function onMessageCreate(message: Message) {
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
}
