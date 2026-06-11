import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import * as Settings from './settings.ts';
import * as SlashManager from './slashManager.ts';
import { onMessageCreate } from './events/onMessageCreate.ts';
import { onInteractionCreate } from './events/onInteractionCreate.ts';
import { onMessageReactionAdd } from './events/onMessageReactionAdd.ts';



//-----------------
// INITIALISATION 
//-----------------

dotenv.config()

export const client = new Client({
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
client.on("interactionCreate", (interaction) => onInteractionCreate(interaction));


// reaction added
client.on("messageReactionAdd", (reaction) => onMessageReactionAdd(reaction));


// add reactions to messages depending on the channel
client.on("messageCreate", (message) => onMessageCreate(message));
