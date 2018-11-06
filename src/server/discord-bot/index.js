const Discord = require("discord.js");
const token = process.env.DISCORD_BOT_TOKEN || require('./bot-token');

const CHANNEL_NAME = 'kaidoodle';

const client = new Discord.Client();

if (!token) {
  throw 'Missing discord bot token!';
}

const config = {
  token,
  prefix: "+"
};


let mainChannel;

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  [...client.channels.entries()].forEach(([_, channel]) => {
    if (channel.name == CHANNEL_NAME) {
      mainChannel = channel;
    }
  });

  client.user.setActivity(`http://kaidoodle.herokuapp.com`);
});

// client.on("guildCreate", guild => {
//   // This event triggers when the bot joins a guild.
//   console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
//   client.user.setActivity(`Serving ${client.guilds.size} servers`);
// });
//
// client.on("guildDelete", guild => {
//   // this event triggers when the bot is removed from a guild.
//   console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
//   client.user.setActivity(`Serving ${client.guilds.size} servers`);
// });


client.on("message", async message => {

  if (message.channel.name !== mainChannel.name) {
    return
  }

  if (message.author.bot) return;

  if (message.content.toLowerCase().includes('test')) {
    message.channel.send(`Testing message.`, {
      files: [
        "./test.txt"
      ]
    })
  }

  if (message.content.toLowerCase().includes('raw')) {
    const m = await message.channel.send("coze?");
    m.edit(`Do pici vypadni s tou brawlhallou odtialto ${message.author.username}`);
  }

  if (message.author.username != 'Jožo'){
    return;
  }

  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // if (command === "ping") {
  //   // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
  //   // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
  //   const m = await message.channel.send("Ping?");
  //   m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  // }
  //
  // if (command === "say") {
  //   // makes the bot say something and delete the message. As an example, it's open to anyone to use.
  //   // To get the "message" itself we join the `args` back into a string with spaces:
  //   const sayMessage = args.join(" ");
  //   // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
  //   message.delete().catch(O_o => {
  //   });
  //   // And we get the bot to say the thing:
  //   message.channel.send(sayMessage);
  // }
  //
  // if (command === "kick") {
  //   // This command must be limited to mods and admins. In this example we just hardcode the role names.
  //   // Please read on Array.some() to understand this bit:
  //   // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
  //   if (!message.member.roles.some(r => ["Administrator", "Moderator"].includes(r.name)))
  //     return message.reply("Sorry, you don't have permissions to use this!");
  //
  //   // Let's first check if we have a member and if we can kick them!
  //   // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
  //   // We can also support getting the member by ID, which would be args[0]
  //   let member = message.mentions.members.first() || message.guild.members.get(args[0]);
  //   if (!member)
  //     return message.reply("Please mention a valid member of this server");
  //   if (!member.kickable)
  //     return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
  //
  //   // slice(1) removes the first part, which here should be the user mention or ID
  //   // join(' ') takes all the various parts to make it a single string.
  //   let reason = args.slice(1).join(' ');
  //   if (!reason) reason = "No reason provided";
  //
  //   // Now, time for a swift kick in the nuts!
  //   await member.kick(reason)
  //     .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
  //   message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
  //
  // }
  //
  // if (command === "ban") {
  //   // Most of this command is identical to kick, except that here we'll only let admins do it.
  //   // In the real world mods could ban too, but this is just an example, right? ;)
  //   if (!message.member.roles.some(r => ["Administrator"].includes(r.name)))
  //     return message.reply("Sorry, you don't have permissions to use this!");
  //
  //   let member = message.mentions.members.first();
  //   if (!member)
  //     return message.reply("Please mention a valid member of this server");
  //   if (!member.bannable)
  //     return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");
  //
  //   let reason = args.slice(1).join(' ');
  //   if (!reason) reason = "No reason provided";
  //
  //   await member.ban(reason)
  //     .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
  //   message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  // }
  //
  if (command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.

    const deleteCount = parseInt(args[0], 10);

    if (!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

    // get messages, and delete them
    const fetched = await message.channel.fetchMessages({ limit: deleteCount });
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }
});

const shareImage = (text, data) => mainChannel.send(text, new Discord.Attachment(new Buffer(data, 'binary'), 'image.png'));

const updateBotStatus = (playerNames) => client.user.setActivity(`${playerNames.length}: ${playerNames.join(', ')}`);

client.login(config.token);

module.exports = { shareImage, updateBotStatus };
