# discord-vanne

Discord bot that automatically forwards messages (as embeds) to a "vannes" ("jokes" in french) channel when they receive enough reactions.

## How it works

- When a message receives a set number of your valid emoji reactions, it is automatically posted as an embed in the *vannes* channel
- Messages posted in the *vannes* channel automatically receive both vote emojis (valid and notValid)
- An admin channel allows configuring the bot via text commands

## Admin commands

| Command | Description |
|---|---|
| `!set cv #channel` | Set the vannes channel |
| `!set ca #channel` | Set the admin channel |
| `!set ev :emoji:` | Set the "valid" emoji |
| `!set epv :emoji:` | Set the "not valid" emoji |
| `!set min number` | Minimum number of reactions to forward a message |
| `!get` | Show current configuration |

## Setup

```bash
git clone https://github.com/e-v-o-l-v-e/bot-discord-vanne-valide.git bot-vanne
cd bot-vanne
npm install
```

Create a `.env` file at the root dir:

```env
DISCORD_TOKEN=your_bot_token_here
```

## Run

```bash
node index.ts
```
