import { ChatInputCommandInteraction, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from "discord.js";

export type GuildSettingsMap = Record<string, GuildSettings>

export interface GuildSettings {
    channels: Channels;
    emojis: Emoji;
    minReactionNumber: number;
    managerRole: string;
}

export interface Channels {
    vannes: string;
    admin: string;
    love: string;
}

export interface Emoji {
    valid: Valid;
    notValid: Valid;
    loading: Valid;
}

export interface Valid {
    id: string;
    name: string;
}


export interface CustomSlashCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
