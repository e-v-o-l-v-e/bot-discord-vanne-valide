import * as Settings from '../settings.ts';
import { GuildMemberRoleManager, type Interaction, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import * as SlashManager from '../slashManager.ts';

export async function onInteractionCreate(interaction: Interaction) {
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
}
