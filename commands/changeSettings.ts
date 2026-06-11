import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { type CustomSlashCommand } from "../types.ts";
import * as Settings from "../settings.ts";

export default {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('set channels emojis etc')
        .addChannelOption(option => option
            .setName('channel_vanne')
            .setDescription('Chose which channel will joke be sent to')
        )
        .addChannelOption(option => option
            .setName('channel_admin')
            .setDescription('Chose which channel you\'ll use as the admin channel')
        )
        .addChannelOption(option => option
            .setName('channel_love')
            .setDescription('Chose which channel the bot will react to every messages with love')
        )
        .addNumberOption(option => option
            .setName('min_reaction_number')
            .setDescription('How many reactions are necessary to save a message in the vannes channel')
        )
        .addStringOption(option => option
            .setName('emoji_valid')
            .setDescription('Emoji for valid reaction (e.g. <:nom:123456789>)')
        )
        .addStringOption(option => option
            .setName('emoji_not_valid')
            .setDescription('Emoji for not valid reaction')
        )
        .addStringOption(option => option
            .setName('emoji_loading')
            .setDescription('Emoji for loading reaction')
        )
        .addRoleOption(option => option
            .setName('bot_manager_role')
            .setDescription('Role allowed to manage the bot')
        )
    ,

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guildId) return;

        const guildSettings = Settings.get(interaction.guildId);

        const channelVanne = interaction.options.getChannel('channel_vanne');
        const channelAdmin = interaction.options.getChannel('channel_admin');
        const channelLove = interaction.options.getChannel('channel_love');
        const minReaction = interaction.options.getNumber('min_reaction_number');
        const emojiValid = interaction.options.getString('emoji_valid');
        const emojiNotValid = interaction.options.getString('emoji_not_valid');
        const emojiLoading = interaction.options.getString('emoji_loading');
        const managerRole = interaction.options.getRole('bot_manager_role');


        if (channelVanne) guildSettings.channels.vannes = channelVanne.id;
        if (channelAdmin) guildSettings.channels.admin = channelAdmin.id;
        if (channelLove) guildSettings.channels.love = channelLove.id;
        if (minReaction) guildSettings.minReactionNumber = minReaction;
        if (managerRole) guildSettings.managerRole = managerRole.id;


        if (emojiValid) {
            const parts = emojiValid.split(':');
            guildSettings.emojis.valid.name = parts[1];
            guildSettings.emojis.valid.id = parts[2].slice(0, -1);
        }
        if (emojiNotValid) {
            const parts = emojiNotValid.split(':');
            guildSettings.emojis.notValid.name = parts[1];
            guildSettings.emojis.notValid.id = parts[2].slice(0, -1);
        }
        if (emojiLoading) {
            const parts = emojiLoading.split(':');
            // handles both <:name:id> and name:id
            guildSettings.emojis.loading.name = parts[1] ?? parts[0];
            guildSettings.emojis.loading.id = parts[2]?.slice(0, -1) ?? parts[1];
        }

        Settings.write();

        // then reply with current state as before
        await interaction.reply('✅');
    }

} satisfies CustomSlashCommand;
