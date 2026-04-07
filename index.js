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

// ✅ TOKEN DO RAILWAY
const TOKEN = process.env.TOKEN;

console.log("TOKEN:", TOKEN);

const CLIENT_ID = "1490137779110285342";
const GUILD_ID = "1477001067366584400";
const CANAL_NOTIFICACAO = "1490147860560216064";

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let pedidos = {};

// ✅ IPTV DE VOLTA
const produtos = [
    "Netflix","Disney+","Prime Video","HBO Max","Crunchyroll",
    "Paramount+","Globoplay","IPTV","YouTube Premium",
    "Globoplay+Premiere","Prime+Premiere","Telecine","Spotify"
];

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

// 🔥 COMANDOS
const commands = [
    new SlashCommandBuilder().setName("painel").setDescription("Abrir painel de produtos"),
    new SlashCommandBuilder().setName("painel_admin").setDescription("Painel admin"),
    new SlashCommandBuilder().setName("lixo").setDescription("Apagar notificações")
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("✅ Comandos registrados GUILD");
    } catch (err) {
        console.error(err);
    }
})();

client.once('ready', () => {
    console.log(`🔥 Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isButton()) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const id = interaction.customId;

            // 🔥 AVISAR ESTOQUE COM EMBED BONITO
            if (id.startsWith("estoque_")) {
                const produto = id.replace("estoque_", "");

                if (!pedidos[produto] || pedidos[produto].length === 0) {
                    return interaction.editReply(`❌ Ninguém pediu ${produto}`);
                }

                for (const userId of pedidos[produto]) {
                    try {
                        const user = await client.users.fetch(userId);

                        const embed = new EmbedBuilder()
                            .setTitle("🔥 Produto de volta ao estoque!")
                            .setDescription(`${produto} já está disponível novamente 🚀`)
                            .addFields(
                                { name: "📦 Produto", value: produto, inline: true },
                                { name: "⚡ Status", value: "Disponível agora", inline: true }
                            )
                            .setColor("#00C853")
                            .setTimestamp()
                            .setFooter({ text: "📌 Loja Central • Corre antes que acabe!" });

                        await user.send({ embeds: [embed] });

                    } catch {}
                }

                pedidos[produto] = [];

                return interaction.editReply(`✅ Todos foram avisados sobre ${produto}`);
            }

            // 👇 USUÁRIO ENTRANDO NA LISTA
            const produto = id;

            if (!pedidos[produto]) pedidos[produto] = [];

            if (pedidos[produto].includes(interaction.user.id)) {
                return interaction.editReply(`⚠️ Você já está na lista de ${produto}`);
            }

            pedidos[produto].push(interaction.user.id);

            await interaction.editReply(`✅ Você entrou na lista de ${produto}`);

            const canal = await client.channels.fetch(CANAL_NOTIFICACAO);
            if (canal) {
                await canal.send(`📢 Novo pedido!\n👤 ${interaction.user.tag}\n📦 ${produto}`);
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ Erro");
        }
    }

    if (interaction.isChatInputCommand()) {

        // 🗑️ /lixo MELHORADO
        if (interaction.commandName === "lixo") {
            await interaction.deferReply({ ephemeral: true });

            try {
                const canal = await client.channels.fetch(CANAL_NOTIFICACAO);

                const mensagens = await canal.messages.fetch({ limit: 100 });

                const agora = Date.now();
                const filtradas = mensagens.filter(msg =>
                    (agora - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000
                );

                const quantidade = filtradas.size;

                await canal.bulkDelete(filtradas, true);

                return interaction.editReply(
                    `🗑️ Limpeza concluída!\n\n📦 ${quantidade} mensagens apagadas com sucesso.`
                );
            } catch (err) {
                console.error(err);
                return interaction.editReply("❌ Erro ao apagar notificações");
            }
        }

        // 🎯 PAINEL
        if (interaction.commandName === "painel") {
            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setTitle("Peça seu produto sem estoque")
                .setDescription(
`📦 Produtos sem estoque

Clique abaixo para entrar na lista de espera 👇
Você será avisado quando voltar!`
                )
                .setColor("#5865F2");

            const rows = [];

            for (let i = 0; i < produtos.length; i += 5) {
                const row = new ActionRowBuilder();

                produtos.slice(i, i + 5).forEach(produto => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(produto)
                            .setLabel(`${emojis[produto]} ${produto}`)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                rows.push(row);
            }

            await interaction.editReply({ embeds: [embed], components: rows });
        }

        // 🔥 ADMIN
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
                content: "🔥 Painel admin:",
                components: rows
            });
        }
    }
});

client.login(TOKEN);