const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const MC_HOST = "ssafe77.aternos.me";
const MC_PORT = "54809";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Check Minecraft server status"),

  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Show Minecraft server address"),

  new SlashCommandBuilder()
    .setName("port")
    .setDescription("Show Minecraft server port"),

  new SlashCommandBuilder()
    .setName("players")
    .setDescription("Show online players"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show full Minecraft server status")
].map(command => command.toJSON());

async function getMinecraftStatus() {
  const url =
    `https://api.mcstatus.io/v2/status/bedrock/${MC_HOST}:${MC_PORT}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { online: false };
    }

    return await response.json();
  } catch (error) {
    return { online: false };
  }
}

client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (error) {
    console.error("Command registration error:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ip") {
    return interaction.reply(
      `🌐 **IP:** \`${MC_HOST}\``
    );
  }

  if (interaction.commandName === "port") {
    return interaction.reply(
      `🔌 **Port:** \`${MC_PORT}\``
    );
  }

  if (
    interaction.commandName === "server" ||
    interaction.commandName === "players" ||
    interaction.commandName === "status"
  ) {
    await interaction.deferReply();

    const data = await getMinecraftStatus();

    if (!data.online) {
      return interaction.editReply(
        `🔴 **Server Offline**\n\n` +
        `🌐 ${MC_HOST}\n` +
        `🔌 Port: ${MC_PORT}`
      );
    }

    const playersOnline = data.players?.online ?? 0;
    const playersMax = data.players?.max ?? "?";

    if (interaction.commandName === "server") {
      return interaction.editReply(
        `🟢 **Server Online**\n` +
        `👥 Players: ${playersOnline}/${playersMax}`
      );
    }

    if (interaction.commandName === "players") {
      return interaction.editReply(
        `👥 **Players:** ${playersOnline}/${playersMax}`
      );
    }

    return interaction.editReply(
      `🟢 **Server Online**\n\n` +
      `🎮 **Edition:** Bedrock\n` +
      `👥 **Players:** ${playersOnline}/${playersMax}\n` +
      `🌐 **IP:** ${MC_HOST}\n` +
      `🔌 **Port:** ${MC_PORT}`
    );
  }
});

client.login(TOKEN);
