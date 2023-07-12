require('dotenv/config');
const Discord = require('discord.js');
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

client.on('messageCreate', async (message) => {
  // Check if the message has attachments
  if (message.attachments.size > 0) {
    // Iterate through each attachment
    message.attachments.forEach((attachment) => {
      if (attachment.name.endsWith('.exe')) {
        message.reply('The file attached to your message is an `.exe`, so we deleted your message for safety reasons.')
          .then(() => {
            message.delete();
          })
          .catch(console.error);
      }
    });
  }
});

client.login(process.env.TOKEN);
