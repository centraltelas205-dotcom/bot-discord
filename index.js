const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

// ✅ TOKEN VINDO DO RAILWAY
const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1490137779110285342";
const GUILD_ID = "1477001067366584400";
const CANAL_NOTIFICACAO = "1490147860560216064";

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let pedidos = {};

const produtos = [
    "Netflix","Disney+","Prime Video","HBO Max","Crunchyroll",
    "Paramount+","Globoplay","IPTV","YouTube Premium",
    "Globoplay+Premiere","Prime+Premiere","Telecine","Spotify"
];

// 🎨 EMOJIS
const emojis = {
    "Netflix": "🎬",
    "Disney+": "🏰",
    "Prime Video": "📦",
    "HBO Max": "🎥",
    "Crunchyroll": "🍥",
    "Paramount+": "⭐",
    "Globoplay": "📺",
    "IPTV": "📡",
    "YouTube Premium": "▶️",
    "Globoplay+Premiere": "⚽",
    "Prime+Premiere": "🏆",
    "Telecine": "🎞️",
    "Spotify": "🎵"
};

// 🔧 COMANDOS
const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Abrir painel de produtos"),

    new SlashCommandBuilder()
        .setName("painel_admin")
        .setDescription("Painel para avisar estoque")
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// 🔥 REGISTRA COMANDOS (só quando iniciar)
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados");
    } catch (err) {
        console.error(err);
    }
})();

client.once('ready', () => {
    console.log(`🔥 Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    // 🔘 BOTÕES
    if (interaction.isButton()) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const id = interaction.customId;

            // 🔥 BOTÃO ADMIN
            if (id.startsWith("estoque_")) {
                const produto = id.replace("estoque_", "");

                if (!pedidos[produto] || pedidos[produto].length === 0) {
                    return await interaction.editReply({
                        content: `❌ Ninguém pediu ${produto}`
                    });
                }

                for (const userId of pedidos[produto]) {
                    try {
                        const user = await client.users.fetch(userId);
                        await user.send(`🔥 ${produto} voltou ao estoque!`);
                    } catch {}
                }

                pedidos[produto] = [];

                return await interaction.editReply({
                    content: `✅ Todos foram avisados sobre ${produto}`
                });
            }

            // 📦 CLIENTE
            const produto = id;

            if (!pedidos[produto]) pedidos[produto] = [];

            if (pedidos[produto].includes(interaction.user.id)) {
                return await interaction.editReply({
                    content: `⚠️ Você já está na lista de ${produto}`
                });
            }

            pedidos[produto].push(interaction.user.id);

            await interaction.editReply({
                content: `✅ Você entrou na lista de ${produto}`
            });

            const canal = await client.channels.fetch(CANAL_NOTIFICACAO);

            if (canal) {
                await canal.send(`📢 Novo pedido!\n👤 ${interaction.user.tag}\n📦 ${produto}`);
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "❌ Erro" });
        }
    }

    // 💬 COMANDOS
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "painel") {
            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setTitle("Peça seu produto sem estoque")
                .setDescription("📦 Produtos sem estoque\n\nClique abaixo 👇")
                .setColor("#5865F2");

            const rows = [];

            for (let i = 0; i < produtos.length; i += 5) {
                const row = new ActionRowBuilder();

                produtos.slice(i, i + 5).forEach(produto => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(produto)
                            .setLabel(`${emojis[produto] || "📺"} ${produto}`)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                rows.push(row);
            }

            await interaction.editReply({
                embeds: [embed],
                components: rows
            });
        }

        if (interaction.commandName === "painel_admin") {
            await interaction.deferReply({ ephemeral: true });

            const rows = [];

            for (let i = 0; i < produtos.length; i += 5) {
                const row = new ActionRowBuilder();

                produtos.slice(i, i + 5).forEach(produto => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`estoque_${produto}`)
                            .setLabel(`🔥 ${produto}`)
                            .setStyle(ButtonStyle.Success)
                    );
                });

                rows.push(row);
            }

            await interaction.editReply({
                content: "🔥 Clique para avisar estoque:",
                components: rows
            });
        }
    }
});

client.login(TOKEN);