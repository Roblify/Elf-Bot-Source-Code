require("dotenv/config")
const { SlashCommandBuilder, EmbedBuilder, Client, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Events, PermissionsBitField, Embed } = require("discord.js");
const Filter = require('bad-words');
const warningSchema = require("./warnSchema.js");
const modLogsSchema = require("./modLogsSchema.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('View the member count of Adam Lopez Server'),
  new SlashCommandBuilder()
    .setName('xmas-fact')
    .setDescription('Generates a random Christmas fact you most likely never knew!'),
  new SlashCommandBuilder()
    .setName('gift-present')
    .setDescription('Give a random generated present to a member of this server')
    .addUserOption(option => option.setName('user').setDescription("The user you want to gift a present to").setRequired(true)),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to warn").setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription("The reason of this user's warn").setRequired(false)),
  new SlashCommandBuilder()
    .setName('history')
    .setDescription('View the history of Adam Lopez!'),
  new SlashCommandBuilder()
    .setName('is-better-than')
    .setDescription('Funny command that grabs two random countries and compare them'),
  new SlashCommandBuilder()
    .setName('clear-warn')
    .setDescription('Clear a warn on a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to clear a warn on").setRequired(true))
    .addNumberOption(option => option.setName('id').setDescription("The ID of the warning").setRequired(true)),
  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check warnings for a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to see warns for").setRequired(true)),
  new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('Check Moderation logs for a user')
    .addUserOption(option => option.setName('user').setDescription("Select the user you want to see Moderation Logs for").setRequired(true)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to ban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of their ban.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to unban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of unbanning them.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge an amount of messages in the channel this command is ran in')
    .addNumberOption(option => option.setName('amount').setDescription('The amount of messages you want purged').setRequired(true)),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from this server')
    .addUserOption(option => option.setName('user').setDescription('Select the user you want to kick.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason of their kick.').setRequired(false)),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot replies with "Pong"'),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user in this server')
    .addUserOption(option => option.setName('target').setDescription('The user you would like to mute').setRequired(true))
    .addStringOption(option => option.setName('duration').setRequired(true).setDescription('The duration of the mute')
      .addChoices(
        { name: '60 Secs', value: '60' },
        { name: '2 Minutes', value: '120' },
        { name: '5 Minutes', value: '300' },
        { name: '10 Minutes', value: '600' },
        { name: '15 Minutes', value: '900' },
        { name: '20 Minutes', value: '1200' },
        { name: '30 Minutes', value: '1800' },
        { name: '45 Minutes', value: '2700' },
        { name: '1 Hour', value: '3600' },
        { name: '2 Hours', value: '7200' },
        { name: '3 Hours', value: '10800' },
        { name: '5 Hours', value: '18000' },
        { name: '10 Hours', value: '36000' },
        { name: '1 Day', value: '86400' },
        { name: '2 Days', value: '172800' },
        { name: '3 Days', value: '259200' },
        { name: '5 Days', value: '432000' },
        { name: 'One Week', value: '604800' }))
    .addStringOption(option => option.setName('reason').setDescription('The reason for muting the user').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in this server')
    .addUserOption(option => option.setName('target').setDescription('The user you would like to unmute').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for unmuting the user').setRequired(false)),
];

client.on('ready', async () => {
  try {
    const registeredCommands = await client.application.commands.set(commands);
    console.log(`${registeredCommands.length} command(s) registered globally.`);
  } catch (e) {
    console.error(e);
  }
});

const logChannelId = '932672023799414865';

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_DB_URL);
mongoose.set('strictQuery', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connection Successful!");

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const guildId = interaction.guild.id;

    if (interaction.commandName === 'ban') {
      if (interaction.replied) {
        return;
      }
      const Users = interaction.options.getUser('user');
      const ID = Users.id;
      const banUser = client.users.cache.get(ID);

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: ":x: You do not have permission to ban users", ephemeral: true })
      }

      if (interaction.member.id === ID) {
        return await interaction.reply({ content: ":x: You cannot ban yourself!", ephemeral: true });
      }

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Dear ${Users.username},`)
        .setDescription(`You have been banned from ${interaction.guild.name} for the following reason:\n**${reason}**\n\nIf you felt like this ban was not fair or want to be unbanned, then you can appeal via [here](https://dyno.gg/form/35f1d018)\n\nYours sincerely,\n${interaction.guild.name} Moderation Team`)

      try {
        await banUser.send({ embeds: [dmEmbed] });

      const logEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`New ban log for ${banUser.username}`)
      .setDescription(`**Reason:** \`${reason}\`\n**Moderator:** ${interaction.user.username}`)
      .setTimestamp()

      const logChannel = client.channels.cache.get(logChannelId);

      await logChannel.send({ embeds: [logEmbed] });

      } catch (err) {
        // If an error occurs while trying to send the DM, log the error to the console
        console.log(`Failed to send DM to user ${banUser.tag}: ${err}`);
      }

      // Defer the interaction before performing any further tasks
      await interaction.deferReply();

      // Attempt to ban the user
      try {
        await interaction.guild.bans.create(banUser.id, { reason });
      } catch (err) {
        return await interaction.editReply({ content: ":x: I cannot ban this member", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ SUCCESS")
        .setDescription(`<@${banUser.id}> has been banned by <@${interaction.user.id}> for the following reason: **${reason}**`)
        .setTimestamp()

      // Send the final reply if the ban was successful
      await interaction.editReply({ embeds: [embed] });

      try {
        const guildId = interaction.guild.id;
        let data = await modLogsSchema.findOne({ GuildID: guildId, UserID: banUser.id, UserTag: banUser.tag });

        if (!data) {
          data = new modLogsSchema({
            GuildID: guildId,
            UserID: banUser.id,
            UserTag: banUser.tag,
            Logs: [
              {
                ActionType: 'BAN',
                ExecuterId: interaction.user.id,
                ExecuterTag: interaction.user.tag,
                Reason: reason,
                Timestamp: new Date(),
              },
            ],
          });
        } else {
          const log = {
            ActionType: 'BAN',
            ExecuterId: interaction.user.id,
            ExecuterTag: interaction.user.tag,
            Reason: reason,
            Timestamp: new Date(),
          };
          data.Logs.push(log);
        }
        await data.save();
      } catch (err) {
        console.log(err);
      }
    } else if (interaction.commandName === "warn") {
  // Check for permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
    return await interaction.reply({
      content: "You do not have permission to warn others",
      ephemeral: true
    });

  const { options, guildId, user } = interaction;

  const target = options.getUser('user');
  const reason = options.getString("reason") || "No reason provided.";

  const userTag = `${target.username}#${target.discriminator}`;

  try {
    const modLogData = await modLogsSchema.findOne({
      GuildID: guildId,
      UserID: target.id,
      UserTag: target.tag
    });

    if (!modLogData) {
      const newModLogData = new modLogsSchema({
        GuildID: guildId,
        UserID: banUser.id,
        UserTag: banUser.tag,
        Logs: [
          {
            ActionType: 'WARN',
            ExecuterId: interaction.user.id,
            ExecuterTag: interaction.user.tag,
            Reason: reason,
            Timestamp: new Date(),
          },
        ],
      });
      await newModLogData.save();
    } else {
      const log = {
        ActionType: 'WARN',
        ExecuterId: interaction.user.id,
        ExecuterTag: interaction.user.tag,
        Reason: reason,
        Timestamp: new Date(),
      };
      modLogData.Logs.push(log);
      await modLogData.save();
    }
  } catch (err) {
    console.log(err);
  }

  try {
    let data = await warningSchema.findOne({
      GuildID: guildId,
      UserID: target.id,
      UserTag: userTag
    });

    if (!data) {
      data = new warningSchema({
        GuildID: guildId,
        UserID: target.id,
        UserTag: userTag,
        Content: [
          {
            ExecuterId: user.id,
            ExecuterTag: user.tag,
            Reason: reason
          }
        ],
      });
    } else {
      const warnContent = {
        ExecuterId: user.id,
        ExecuterTag: user.tag,
        Reason: reason
      };
      data.Content.push(warnContent);
    }
    await data.save();
  } catch (err) {
    console.log(err);
  }

  const dmEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle(`Dear ${target.username},`)
    .setDescription(`You have been warned in ${interaction.guild.name} for the following reason:\n\`${reason}\`\n\nPlease be advised if this behavior continues then stricter Moderation actions may be placed on you.\n\nYours sincerely,\n${interaction.guild.name} Moderation Team.`);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`✅ SUCCESS`)
    .setDescription(`**Warned User:** <@${target.id}>\n**Reason:** \`${reason}\`\n**Moderator:** <@${interaction.user.id}>`);

  target.send({ embeds: [dmEmbed] }).catch(err => {
    return;
  });

  const logEmbed = new EmbedBuilder()
    .setColor('Red')
    .setTitle(`New warn log for ${target.username}`)
    .setDescription(`**Reason:** \`${reason}\`\n**Moderator:** ${interaction.user.username}`)
    .setTimestamp();

  const logChannel = await client.channels.cache.get(logChannelId);
  logChannel.send({ embeds: [logEmbed] }); // Remove unnecessary await

  interaction.reply({ embeds: [embed] });
} else if (interaction.commandName === "warnings") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return await interaction.reply({ content: "You do not have permission to warn others", ephemeral: true })

      const { options, guildId, user } = interaction;

      const target = options.getUser('user')

      const embed = new EmbedBuilder()
      const noWarns = new EmbedBuilder

      try {
        const data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag });

        if (data) {
          embed.setColor("Red")
            .setDescription(`${target.tag}'s warnings: \n${data.Content.map(
              (w, i) =>
                `
                    **Warning:** ${i + 1}
                    **Moderator:** ${w.ExecuterTag}
                    **Reason:** ${w.Reason}
                `
            ).join(`**---**`)}`);

          interaction.reply({ embeds: [embed] });
        } else {
          noWarns.setColor("Red")
            .setDescription(`${target.tag} has no warnings`);

          interaction.reply({ embeds: [noWarns] });
        }
      } catch (err) {
        console.log(err);
      }

    } else if (interaction.commandName === "clear-warn") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return await interaction.reply({ content: "You do not have permission to clear peoples warnings", ephemeral: true });
      }

      const { options, guildId, user } = interaction;
      const target = options.getUser('user');
      const warningIndex = options.getNumber('id'); // Get the warning ID (index) from the options

      const embed = new EmbedBuilder();

      try {
        // Retrieve all warnings for the user
        const data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag });

        if (data && data.Content.length > 0 && data.Content.length > warningIndex - 1) {
          // Remove the warning with the specified ID (index) from the Content array
          data.Content.splice(warningIndex - 1, 1);

          // Save the updated data back to the database
          await data.save();

          embed.setColor("Green")
            .setTitle(":white_check_mark: SUCCESS")
            .setDescription(`Warning with ID ${warningIndex} for ${target.tag} has been cleared`); // Update the success message

          interaction.reply({ embeds: [embed] });
        } else {
          interaction.reply({ content: `${target.tag} has no warning with ID ${warningIndex} to be cleared`, ephemeral: true });
        }
      } catch (err) {
        throw err;
      }
    } else if (interaction.commandName === "unban") {

      const userID = interaction.options.getUser('user');

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: ":x: You do not have permission to unban users", ephemeral: true })
      }

      if (interaction.member.id === userID) {
        return await interaction.reply({ content: ":x: You cannot unban yourself!", ephemeral: true });
      }

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ SUCCESS")
        .setDescription(`${userID} has been unbanned by <@${interaction.user.id}> for the following reason: **${reason}**`)
        .setTimestamp()

      await interaction.guild.bans.fetch()
        .then(async bans => {

          if (bans.size == 0) return await interaction.reply({ content: ":x: There is no one banned from this server", ephemeral: true })
          let bannedID = bans.find(ban => ban.user.id == userID);
          if (!bannedID) return await interaction.reply({ content: ":x: The ID stated is not banned from this server", ephemeral: true })

          await interaction.guild.bans.remove(userID, reason).catch(err => {
            return interaction.reply({ content: ":x: I cannot unban this user" })
          })
        })

      await interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName === "mute") {
      const timeUser = interaction.options.getUser('target');
      const timeMember = await interaction.guild.members.fetch(timeUser.id);
      const channel = interaction.channel;
      const duration = interaction.options.getString('duration');
      const user = interaction.options.getUser('user') || interaction.user;

      await interaction.deferReply({ ephemeral: false });

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
        return interaction.reply({ content: ":x: You do not have permission to run this command", ephemeral: true });

      if (!timeMember)
        return await interaction.reply({ content: ':x: The user mentioned is no longer within the server.', ephemeral: true });

      if (!timeMember.kickable)
        return interaction.reply({ content: ':x: I cannot mute this user!', ephemeral: true });

      if (!duration)
        return interaction.reply({ content: ':x: You must set a valid duration for the timeout', ephemeral: true });

      if (interaction.member.id === timeMember.id)
        return interaction.reply({ content: ":x: You cannot timeout yourself!", ephemeral: true });

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      await timeMember.timeout(duration * 1000, reason);

      const minEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`✅ SUCCESS`)
        .setDescription(`<@${timeMember.id}> has been muted for **${duration / 60}** minute(s) for the following reason:\n**${reason}**`)
        .setFooter({ text: `User: ${user.tag}` })
        .setTimestamp();

      const dmEmbed = new EmbedBuilder()
        .setTitle(`Hello ${timeMember.user.username}`)
        .setDescription(`You have been muted in ${interaction.guild.name} for **${duration / 60}** minute(s) for the following reason:\n**${reason}**\n\nIf you felt like this mute was not fair or want to be unmuted, then you can appeal via [here](https://dyno.gg/form/35f1d018)\n\nYours sincerely,\n${interaction.guild.name} Moderation Team`)
        .setColor('DarkRed')
        .setTimestamp();

      await timeMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      });

      const logEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`New mute log for ${timeMember.username}`)
      .setDescription(`**Reason:** \`${reason}\`\n**Moderator:** ${interaction.user.username}`)
      .setTimestamp()

      const logChannel = client.channels.cache.get(logChannelId);

      logChannel.send({ embeds: [logEmbed] });

      await interaction.editReply({ embeds: [minEmbed], ephemeral: false });

      try {
        const guildId = interaction.guild.id;
        let data = await modLogsSchema.findOne({ GuildID: guildId, UserID: timeMember.id, UserTag: timeMember.user.tag });

        if (!data) {
          data = new modLogsSchema({
            GuildID: guildId,
            UserID: timeMember.id,
            UserTag: timeMember.user.tag,
            Logs: [
              {
                ActionType: 'MUTE',
                ExecuterId: user.id,
                ExecuterTag: user.tag,
                Reason: reason,
                Timestamp: new Date(),
              },
            ],
          });
        } else {
          const log = {
            ActionType: 'MUTE',
            ExecuterId: user.id,
            ExecuterTag: user.tag,
            Reason: reason,
            Timestamp: new Date(),
          };
          data.Logs.push(log);
        }
        await data.save();
      } catch (err) {
        console.log(err);
      }
    } else if (interaction.commandName === 'modlogs') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return await interaction.reply({ content: "You do not have permission to view moderation logs of users", ephemeral: true })
      }

      const { options, guildId } = interaction;
      const target = options.getUser('user');

      const embed = new EmbedBuilder();

      console.log('Interaction:', interaction);
      console.log('Options:', options);
      console.log('Target:', target);

      try {
        const data = await modLogsSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag });

        console.log('Data:', data);

        if (data) {
          embed.setColor("DarkRed")
            .setTitle(`${target.tag}'s moderation logs:`)
            .setDescription(data.Logs.map((log, i) => `
              **Log ID:** ${i + 1}
              **Action:** ${log.ActionType}
              **Moderator:** ${log.ExecuterTag}
              **Reason:** ${log.Reason}
            `).join('\n'));

          interaction.reply({ embeds: [embed] });
        } else {
          interaction.reply({ content: `${target.tag} has no moderation logs`, ephemeral: true });
        }
      } catch (err) {
        console.log(err);
      }
    } else if (interaction.commandName === "unmute") {
      const timeUser = interaction.options.getUser('target');
      const timeMember = await interaction.guild.members.fetch(timeUser.id);
      const user = interaction.options.getUser('user') || interaction.user;

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({ content: "You do not have permission to run this command", ephemeral: true })
      if (!timeMember.kickable) return interaction.reply({ content: 'I cannot timeout this user! This is either because their higher then me or you.', ephemeral: true })
      if (interaction.member.id === timeMember.id) return interaction.reply({ content: "You cannot timeout yourself!", ephemeral: true })

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason given."

      await timeMember.timeout(null, reason)

      const unminEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`✅ SUCCESS`)
        .setDescription(`<@${timeMember.id}> has been unmuted for the following reason:\n**${reason}**`)
        .setFooter({ text: `User: ${user.tag}` })
        .setTimestamp();


      const dmEmbed = new EmbedBuilder()
        .setTitle(`Hello ${timeMember.user.username}`)
        .setDescription(`You have been unmuted in ${interaction.guild.name} for the following reason:\n**${reason}**\n\nIf you felt like this unmute was not fair or want to provide feedback, then you can try reaching out to the Moderators of this server\n\nYours sincerely,\n${interaction.guild.name} Moderation Team`)
        .setColor('DarkGreen')
        .setTimestamp();


      await timeMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      })

      await interaction.reply({ embeds: [unminEmbed] })
    } else if (interaction.commandName === 'ping') {
      const startTime = Date.now();
      interaction.reply('Pong!').then(() => {
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        interaction.editReply(`Pong! Response time: \`${pingTime}ms\``);
      });
    } else if (interaction.commandName === 'kick') {
      const target = interaction.options.getUser('user');
      const kickUser = client.users.cache.get(target.id);
      const kickMember = await interaction.guild.members.fetch(kickUser.id);


      if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return await interaction.reply({ content: ":x: You do not have permission to kick users", ephemeral: true })
      }

      if (kickUser.id === interaction.user.id) {
        return await interaction.reply({ content: ":x: You cannot kick yourself!" })
      }

      if (!kickMember.kickable) return await interaction.reply({ content: ":x: I cannot kick this user" })

      let reason = interaction.options.getString('reason');
      if (!reason) reason = "No reason provided.";

      const dmEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle(`Hello ${kickMember.user.username},`)
        .setDescription(`You have been kicked from Adam Lopez server for the following reason:\n**${reason}**\n\nYours sincerely,\nAdam Lopez Moderation Team.`)


      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ SUCCESS")
        .setDescription(`${kickMember} has been kicked by <@${interaction.user.id}> for the following reason:\n**${reason}**`)

      const logEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(`New kick log for ${kickMember.username}`)
      .setDescription(`**Reason:** \`${reason}\`\n**Moderator:** ${interaction.user.username}`)
      .setTimestamp()

      const logChannel = client.channels.cache.get(logChannelId);

      logChannel.send({ embeds: [logEmbed] });

      await kickMember.send({ embeds: [dmEmbed] }).catch(err => {
        return;
      });

      await kickMember.kick({ reason: reason }).catch(err => {
        interaction.reply({ content: ":x: There was an error kicking this user", ephemeral: true });
      });

      await interaction.reply({ embeds: [embed] });


      try {
        const guildId = interaction.guild.id;
        let data = await modLogsSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: target.tag });

        if (!data) {
          data = new modLogsSchema({
            GuildID: guildId,
            UserID: target.id,
            UserTag: target.tag,
            Logs: [
              {
                ActionType: 'KICK',
                ExecuterId: interaction.user.id,
                ExecuterTag: interaction.user.tag,
                Reason: reason,
                Timestamp: new Date(),
              },
            ],
          });
        } else {
          const log = {
            ActionType: 'KICK',
            ExecuterId: interaction.user.id,
            ExecuterTag: interaction.user.tag,
            Reason: reason,
            Timestamp: new Date(),
          };
          data.Logs.push(log);
        }
        await data.save();
      } catch (err) {
        console.log(err);
      }
    } else if (interaction.commandName === 'purge') {
      const amount = interaction.options.getNumber('amount');

      interaction.deferReply();

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
        return interaction.editReply({ content: ":x: You do not have permission to purge messages", ephemeral: true });

      if (amount > 100) {
        return interaction.editReply(':x: The purge amount cannot exceed 100');
      }

      if (amount <= 0) {
        return interaction.editReply(':x: The purge amount must be at least 1');
      }

      try {
        const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
        await interaction.channel.bulkDelete(messages);
        interaction.editReply(`:white_check_mark: Successfully purged **${amount} messages**`);
      } catch (error) {
        console.error('Failed to purge messages:', error);
        interaction.editReply(':x: Failed to purge messages');
      }
    } else if (interaction.commandName === 'membercount') {
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle('Members')
        .setDescription(`${interaction.guild.memberCount}`)
        .setTimestamp()

      interaction.reply({ embeds: [embed] })
    } else if (interaction.commandName === 'is-better-than') {
      const countries = [
        "Afghanistan",
        "Albania",
        "Algeria",
        "Andorra",
        "Angola",
        "Antigua and Barbuda",
        "Argentina",
        "Armenia",
        "Australia",
        "Austria",
        "Azerbaijan",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belgium",
        "Belize",
        "Benin",
        "Bhutan",
        "Bolivia",
        "Bosnia and Herzegovina",
        "Botswana",
        "Brazil",
        "Brunei",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cabo Verde",
        "Cambodia",
        "Cameroon",
        "Canada",
        "Central African Republic",
        "Chad",
        "Chile",
        "China",
        "Colombia",
        "Comoros",
        "Congo",
        "Costa Rica",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czechia",
        "Denmark",
        "Djibouti",
        "Dominica",
        "Dominican Republic",
        "Ecuador",
        "Egypt",
        "El Salvador",
        "Equatorial Guinea",
        "Eritrea",
        "Estonia",
        "Eswatini",
        "Ethiopia",
        "Fiji",
        "Finland",
        "France",
        "Gabon",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Greece",
        "Grenada",
        "Guatemala",
        "Guinea",
        "Guinea-Bissau",
        "Guyana",
        "Haiti",
        "Honduras",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakhstan",
        "Kenya",
        "Kiribati",
        "Kosovo",
        "Kuwait",
        "Kyrgyzstan",
        "Laos",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libya",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Mali",
        "Malta",
        "Marshall Islands",
        "Mauritania",
        "Mauritius",
        "Mexico",
        "Micronesia",
        "Moldova",
        "Monaco",
        "Mongolia",
        "Montenegro",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Nepal",
        "Netherlands",
        "New Zealand",
        "Nicaragua",
        "Niger",
        "Nigeria",
        "North Korea",
        "North Macedonia",
        "Norway",
        "Oman",
        "Pakistan",
        "Palau",
        "Panama",
        "Papua New Guinea",
        "Paraguay",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Romania",
        "Russia",
        "Rwanda",
        "Saint Kitts and Nevis",
        "Saint Lucia",
        "Saint Vincent and the Grenadines",
        "Samoa",
        "San Marino",
        "Sao Tome and Principe",
        "Saudi Arabia",
        "Senegal",
        "Serbia",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Korea",
        "South Sudan",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Suriname",
        "Sweden",
        "Switzerland",
        "Syria",
        "Taiwan",
        "Tajikistan",
        "Tanzania",
        "Thailand",
        "Timor-Leste",
        "Togo",
        "Tonga",
        "Trinidad and Tobago",
        "Tunisia",
        "Turkey",
        "Turkmenistan",
        "Tuvalu",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States of America",
        "Uruguay",
        "Uzbekistan",
        "Vanuatu",
        "Vatican City",
        "Venezuela",
        "Vietnam",
        "Yemen",
        "Zambia",
        "Zimbabwe"
      ];
      const randomCountry1 = countries[Math.floor(Math.random() * countries.length)];
      const randomCountry2 = countries[Math.floor(Math.random() * countries.length)];

      interaction.reply(`${randomCountry1} is better than ${randomCountry2} <:troll:1092736969408262166>`)
    } else if (interaction.commandName === 'history') {
      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Adam Lopez History!')
        .setDescription(`Adam Lopez is a Christmas YouTuber with over 100,000 total views and has over 560 subscribers on his main channel. He has a second channel for gameplay content, and he streamed Santa Tracker for the first time on Christmas Eve 2021. His first video was https://www.youtube.com/watch?v=xGZpUbpfvhk&ab_channel=AdamLopez. Adam collaborated with GSTN and STM before they retired from YouTube. He keeps his viewers updated with monthly videos and test streams, and his fan-made channel is not affiliated with NORAD or Google Santa Tracker.`)
        .setImage('https://images-ext-2.discordapp.net/external/K_ZJQh0lQy_9ntv-gEzjQKwMRd3ffF4IrEGG7KZVKtg/https/images-ext-2.discordapp.net/external/7upwR_70q17zAYj_A7W_zPjqkghtn26kFBTiZ9SDMeg/https/cdn-longterm.mee6.xyz/plugins/commands/images/903330043403599892/0aa1ac8fdc05d54411afe764dc8d88127284f8e59338e5608232546d8d9e51e2.png')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else if (interaction.commandName === 'xmas-fact') {
      
      const xmasFacts = [
          "The tradition of putting up Christmas trees originated in Germany in the 16th century.",
  "The world's largest floating Christmas tree is located in Rio de Janeiro, Brazil.",
  "The highest-grossing Christmas movie of all time is 'Home Alone' (1990).",
  "The famous Christmas song 'Jingle Bells' was written by James Lord Pierpont in 1857.",
  "The first artificial Christmas tree was made in Germany using dyed goose feathers.",
  "In 1962, the first Christmas postage stamp was issued in the United States.",
  "The world's largest snowflake ever recorded had a diameter of 15 inches.",
  "The tradition of hanging stockings originated from the story of St. Nicholas.",
  "Christmas stockings were originally hung by the fireplace to dry.",
  "The world's largest Christmas stocking measured 106 feet long and 49 feet wide.",
  "Rudolph the Red-Nosed Reindeer was created by a copywriter for Montgomery Ward in 1939.",
  "The tradition of sending Christmas cards started in the United Kingdom in 1843.",
  "The first recorded date of Christmas being celebrated on December 25th was in 336 AD.",
  "In 1223, St. Francis of Assisi created the first nativity scene in Italy.",
  "The world's largest gingerbread house was over 60 feet long and made of 35,000 pounds of gingerbread dough.",
  "The poinsettia, a popular Christmas plant, is named after Joel Roberts Poinsett, the U.S. Ambassador to Mexico.",
  "The tradition of kissing under the mistletoe dates back to ancient Scandinavia.",
  "The concept of Santa Claus has roots in the ancient Norse god Odin.",
  "The first Christmas tree ornaments were apples.",
  "In Sweden, a common Christmas decoration is a goat made of straw.",
  "Coca-Cola played a significant role in shaping the modern image of Santa Claus.",
  "The world's largest collection of Santa Claus memorabilia is held by Jean-Guy Laquerre of Canada.",
  "In Catalonia, it's customary to display a figurine of a defecating man in nativity scenes.",
  "The world's largest Advent calendar measured 71 feet by 23 feet.",
  "In Ukraine, it's a tradition to decorate Christmas trees with spider webs for good luck.",
  "The average American consumes around 7,000 calories on Christmas Day.",
  "The tradition of Christmas caroling began in England.",
  "The largest Christmas cracker pulled contained 63 people.",
  "In Germany, it's believed that finding a pickle ornament on the Christmas tree brings good luck.",
  "The original three gifts mentioned in the song 'Twelve Days of Christmas' were birds: a partridge, turtle doves, and French hens.",
  "In Italy, a witch called La Befana delivers presents to children on the eve of Epiphany.",
  "The tradition of hanging stockings by the fireplace comes from the story of St. Nicholas.",
  "In Mexico, a festive piñata is often part of the Christmas celebrations.",
  "The first recorded Christmas tree was in Latvia in 1510.",
  "The tradition of the Yule Log comes from the ancient Nordic tradition of burning a large log to celebrate the winter solstice.",
  "The candy cane originated in Germany as straight, white sticks of sugar candy.",
  "In Iceland, there's a Christmas tradition of giving books on Christmas Eve and spending the rest of the night reading.",
  "The largest gathering of Santa Claus impersonators took place in 2014 in Ireland, with 4,800 Santas.",
  "In Brazil, it's traditional to create nativity scenes using sand instead of snow.",
  "In the Netherlands, Christmas is celebrated over two days, with the main day being December 25th.",
  "In South Africa, it's a tradition to eat deep-fried caterpillars called 'Mopane worms' on Christmas Day.",
  "In Spain, it's customary to eat 12 grapes at midnight on New Year's Eve for good luck.",
  "In Portugal, it's customary to place an extra place setting on the Christmas table for deceased relatives.",
  "In Ethiopia, Christmas is celebrated on January 7th and is called 'Ganna.'",
  "In Hungary, it's common to exchange gifts on St. Nicholas Day, which falls on December 6th.",
  "In Sweden, it's customary to watch a Disney Christmas special called 'Kalle Anka och hans vänner önskar God Jul' on Christmas Eve.",
  "In Colombia, it's common to light candles and place them in paper lanterns called 'farolitos' on Christmas Eve.",
  "In Finland, it's believed that Santa Claus lives in the northern part of the country called Lapland.",
  "In Denmark, it's traditional to celebrate Christmas with a rice pudding dish containing a hidden almond.",
  "In Australia, Christmas falls during the summer season, so it's common to have a barbeque on Christmas Day.",
  "In France, a traditional Christmas meal includes oysters and foie gras.",
  "In the United Kingdom, it's a tradition to pull Christmas crackers, which contain small gifts and jokes.",
  "In Poland, it's customary to have twelve dishes on Christmas Eve, representing the twelve apostles.",
  "In Japan, it's a popular tradition to eat a Christmas cake, typically a sponge cake topped with cream and strawberries.",
  "In Romania, it's customary to celebrate Christmas with a feast that includes a pig sacrifice.",
  "In Canada, it's common to have a 'Taffy Pull,' where taffy is stretched and pulled as a Christmas activity.",
  "In India, Christmas is celebrated by decorating mango or banana trees.",
  "In Russia, Christmas is celebrated on January 7th according to the Orthodox calendar.",
  "In China, Christmas is not a public holiday, but it's becoming increasingly popular as a commercial celebration.",
  "In Scotland, it's traditional to bring in a large, round loaf of bread called a 'Yule Bannock' for Christmas.",
  "In the United States, the President traditionally pardons a turkey on Thanksgiving, not Christmas.",
  "In Norway, it's common to light a candle in each window on Christmas Eve.",
  "In Greece, children go from house to house singing carols on Christmas Eve.",
  "In Switzerland, a character called 'Samichlaus' accompanies Santa Claus to deliver gifts to children.",
  "In Belgium, it's traditional to exchange gifts on St. Nicholas Day, which is celebrated on December 6th.",
  "In the Czech Republic, it's customary to fast on Christmas Eve and then eat a festive meal in the evening.",
  "In Mexico, it's customary to celebrate the Posadas, a nine-day reenactment of Mary and Joseph's search for shelter.",
  "In Guatemala, it's traditional to construct an intricate nativity scene called 'nacimiento.'",
  "In Venezuela, it's customary to attend early morning church services called 'Misa de Aguinaldo' during the nine days before Christmas.",
"In Austria, it's customary to leave a shoe outside the door on St. Nicholas Day, December 6th, to be filled with treats and gifts."
        ];

  const randomFact = xmasFacts[Math.floor(Math.random() * xmasFacts.length)];

  interaction.reply(`Christmas Fact: **${randomFact}**`);
} else if (interaction.commandName === 'gift-present') {
      const user = interaction.options.getUser('user');

      const gifts = [
  "Cuddly Teddy Bear",
  "Sparkling Snow Globe",
  "Santa Hat",
  "Festive Christmas Sweater",
  "Hot Chocolate Gift Set",
  "Gingerbread House Kit",
  "Christmas Movie Marathon Pack",
  "Holiday Scented Candles",
  "Cozy Flannel Pajamas",
  "Christmas Cookie Baking Kit",
  "Personalized Ornament",
  "Holiday Music Box",
  "Fuzzy Socks",
  "Santa Claus Figurine",
  "Christmas-themed Puzzle",
  "Handmade Christmas Card",
  "Warm Winter Scarf",
  "Mistletoe",
  "Christmas-themed Mug",
  "Fancy Wine Bottle Opener",
  "Holiday Cookie Tin",
  "Festive Wine Glasses",
  "Christmas-themed Apron",
  "Holiday-themed Board Game",
  "Christmas Tree Decoration Set",
  "Holiday Baking Cookbook",
  "Spa Gift Basket",
  "Portable Bluetooth Speaker",
  "Christmas-themed Phone Case",
  "Holiday Bath Bombs",
  "Ugly Christmas Sweater",
  "Festive Popcorn Tin",
  "Christmas-themed Doormat",
  "Personalized Photo Calendar",
  "Holiday-themed Tote Bag",
  "Gift Card to Favorite Store",
  "Holiday-themed Throw Pillow",
  "Christmas Tree Lights",
  "Santa Claus Slippers",
  "Festive Oven Mitts",
  "Holiday-themed Earrings",
  "Christmas-themed Phone Wallpaper",
  "Festive Beverage Coasters",
  "Christmas-themed Enamel Pin",
  "Holiday-themed Keychain",
  "Portable Power Bank",
  "Christmas-themed Socks",
  "Holiday-themed Coffee Table Book",
  "Festive Wine Bottle Stopper",
  "Christmas-themed Wall Art",
  "Holiday-themed Journal",
  "Santa Claus Beard Kit",
  "Christmas Tree Topper",
  "Holiday-themed Phone Pop Socket",
  "Festive Cookie Cutters",
  "Holiday-themed Tumbler",
  "Christmas-themed Throw Blanket",
  "Festive Oven Mitts",
  "Holiday-themed Earrings",
  "Christmas-themed Phone Wallpaper",
  "Festive Beverage Coasters",
  "Christmas-themed Enamel Pin",
  "Holiday-themed Keychain",
  "Portable Power Bank",
  "Christmas-themed Socks",
  "Holiday-themed Coffee Table Book",
  "Festive Wine Bottle Stopper",
  "Christmas-themed Wall Art",
  "Holiday-themed Journal",
  "Santa Claus Beard Kit",
  "Christmas Tree Topper",
  "Holiday-themed Phone Pop Socket",
  "Festive Cookie Cutters",
  "Holiday-themed Tumbler",
  "Christmas-themed Throw Blanket",
  "Santa Claus Stocking",
  "Festive Table Runner",
  "Holiday-themed Mouse Pad",
  "Christmas Tree Skirt",
  "Holiday-themed Face Mask",
  "Festive Paper Napkins",
  "Holiday-themed Pencil Set",
  "Christmas-themed Temporary Tattoos",
  "Holiday-themed Water Bottle",
  "Festive Wine Bottle Cover",
  "Christmas-themed Luggage Tag",
  "Holiday-themed Desk Calendar",
  "Santa Claus Key Bottle Opener",
  "Christmas Tree Ornament Storage Box",
  "Holiday-themed Coasters",
  "Festive Cookie Jar",
  "Christmas-themed Wall Calendar",
  "Holiday-themed Pillowcase Set",
  "Christmas-themed Magnet Set",
  "Holiday-themed Sticky Notes",
  "Festive Wine Charms",
  "Christmas-themed Headband",
  "Holiday-themed Paper Clips",
  "Santa Claus Hat",
  "Christmas Tree Garland",
  "Holiday-themed Notepad",
  "Festive Drink Stirrers",
  "Holiday-themed Puzzle Cube",
  "Christmas-themed Luggage Strap",
  "Holiday-themed Desk Organizer",
  "Santa Claus Oven Mitts",
  "Christmas-themed Tea Towels",
  "Festive Cocktail Shaker",
  "Holiday-themed Scented Soap",
  "Christmas Tree Storage Bag",
  "Holiday-themed Greeting Cards",
  "Festive Wine Bottle Bag",
  "Christmas-themed Bottle Opener",
  "Holiday-themed Sticky Flags",
  "Santa Claus Mug Warmer",
  "Christmas-themed Wax Seal Stamp",
  "Holiday-themed Address Labels",
  "Festive Coaster Set",
  "Christmas-themed Fridge Magnets",
  "Holiday-themed USB Flash Drive",
  "Christmas Tree Stand",
  "Holiday-themed Cookie Stamp",
  "Santa Claus Apron",
  "Christmas-themed Pot Holders",
  "Festive Phone Charger",
  "Holiday-themed Soap Dispenser",
  "Christmas-themed Party Hats",
  "Never seen before STM Return video access"
];


const randomGift = gifts[Math.floor(Math.random() * gifts.length)];

      interaction.reply(`<a:blob_gift:1127110402065576016> <@${user.id}> the user of ${interaction.user.username} has gifted you a present: ||${randomGift}||`);
    }
  });
});

client.login(process.env.TOKEN);
