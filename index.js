require('dotenv/config')
require("./commands.js")
require("./exeHandler.js")
const { Client, GatewayIntentBits, ActivityType } = require("discord.js")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on('ready', () => {
  console.log(`${client.user.tag} is online!`)

  client.user.setActivity({
    name: 'Adam Lopez',
    type: ActivityType.Watching,
  });
});

client.login(process.env.TOKEN)
