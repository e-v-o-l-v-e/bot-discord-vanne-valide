import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { type CustomSlashCommand } from "../types.ts";
import * as Settings from "../settings.ts";

export default {
    data: new SlashCommandBuilder().setName('show_settings').setDescription('Replies with the guild specific settings'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) {
            console.error("Guild Id is null or undefined, can't get settings.");
            return;
        }

        const guildSettings = Settings.get(interaction.guildId)

        await interaction.reply(`infos:
    guild.minReactionNumber : ${guildSettings.minReactionNumber}
    guild.channels.vannes : <#${guildSettings.channels.vannes}>
    guild.channels.admin : <#${guildSettings.channels.admin}>
    guild.channels.love : <#${guildSettings.channels.love}>
    guild.emojis.valid.id : <:${guildSettings.emojis.valid.name}:${guildSettings.emojis.valid.id}>
    guild.emojis.notValid.id : <:${guildSettings.emojis.notValid.name}:${guildSettings.emojis.notValid.id}>
    guild.emojis.loading : <:${guildSettings.emojis.loading.name}:${guildSettings.emojis.loading.id}>
    guild.managerRole : <@&${guildSettings.managerRole}>
    `);
    }
} satisfies CustomSlashCommand;
