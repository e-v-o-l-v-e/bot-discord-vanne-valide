import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

dotenv.config()

// settings
const vanneChannelId = "1502069249727004912";
const emojiValideId = "1489978419339853894";
const emojiPasValideId = "1491701557451030638";
const minReactionNumber = 2;


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
// check si c'est :harnein_valide:
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
    return
  }

  // console.log(reaction.emoji.id);

  const message = reaction.message;
  if (message.channelId != vanneChannelId)
    if (reaction.count && reaction.count == minReactionNumber)
      if (reaction.emoji.id == emojiValideId)
        message.forward(vanneChannelId);
})


// ajoute les reactions aux messages transférés
client.on("messageCreate", async (message) => {
  if (message.channelId == vanneChannelId) {
    message.react(emojiValideId)
    message.react(emojiPasValideId)
  }
})


client.login(process.env.DISCORD_TOKEN);  
