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
    EmbedBuilder,
    PermissionsBitField,
    ChannelType
} = require('discord.js');

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1490137779110285342";
const GUILD_ID = "1477001067366584400";
const CANAL_NOTIFICACAO = "1490147860560216064";

const CATEGORIA_TICKETS = "1495879919258042600";
const CARGO_ADMIN = "1477086255136243898";

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let pedidos = {};

const produtos = [
    "Netflix","Disney+","Prime Video","HBO Max","Crunchyroll",
    "Paramount+","Globoplay","IPTV","YouTube Premium",
    "Globoplay+Premiere","Prime+Premiere","Telecine","Spotify"
];

const emojis = {
    "Netflix": "🎬","Disney+": "🏰","Prime Video": "📦","HBO Max": "🎥",
    "Crunchyroll": "🍥","Paramount+": "⭐","Globoplay": "📺","IPTV": "📡",
    "YouTube Premium": "▶️","Globoplay+Premiere": "⚽",
    "Prime+Premiere": "🏆","Telecine": "🎞️","Spotify": "🎵"
};

// COMANDOS
const commands = [
    new SlashCommandBuilder().setName("painel").setDescription("Abrir painel"),
    new SlashCommandBuilder().setName("painel_admin").setDescription("Admin"),
    new SlashCommandBuilder().setName("lixo").setDescription("Limpar notificações"),
    new SlashCommandBuilder().setName("comprar").setDescription("Abrir ticket")
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

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
    console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    try {

        // ================= BOTÕES =================
        if (interaction.isButton()) {

            const id = interaction.customId;

            // 🎫 ABRIR TICKET
            if (id === "abrir_ticket") {

                const existente = interaction.guild.channels.cache.find(c =>
                    c.name === `ticket-${interaction.user.id}`
                );

                if (existente) {
                    return interaction.reply({ content: "⚠️ Você já tem um ticket aberto!", ephemeral: true });
                }

                const canal = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: CATEGORIA_TICKETS,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                        { id: CARGO_ADMIN, allow: [PermissionsBitField.Flags.ViewChannel] }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setTitle("🎫 𝑻𝑰𝑪𝑲𝑬𝑻 𝑪𝑶𝑴𝑷𝑹𝑨")
                    .setDescription(`Olá ${interaction.user}, descreva seu pedido.`)
                    .setColor("Blue");

                const fechar = new ButtonBuilder()
                    .setCustomId("fechar_ticket")
                    .setLabel("🔒 Fechar Ticket")
                    .setStyle(ButtonStyle.Danger);

                await canal.send({
                    embeds: [embed],
                    components: [new ActionRowBuilder().addComponents(fechar)]
                });

                return interaction.reply({ content: "✅ Ticket criado!", ephemeral: true });
            }

            // 🔒 FECHAR TICKET
            if (id === "fechar_ticket") {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.reply({ content: "❌ Apenas administradores!", ephemeral: true });
                }

                await interaction.reply("🔒 Fechando em 3s...");

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 3000);

                return;
            }

            // 🔔 AVISO ESTOQUE
            if (id.startsWith("estoque_")) {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.reply({ content: "❌ Apenas admin!", ephemeral: true });
                }

                const produto = id.replace("estoque_", "");

                if (!pedidos[produto] || pedidos[produto].length === 0) {
                    return interaction.reply({ content: "⚠️ Ninguém pediu esse produto.", ephemeral: true });
                }

                for (const userId of pedidos[produto]) {
                    try {
                        const user = await client.users.fetch(userId);

                        const embed = new EmbedBuilder()
                            .setTitle("🔥 Produto disponível!")
                            .setDescription(`${produto} voltou ao estoque 🚀`)
                            .setColor("Green");

                        await user.send({ embeds: [embed] });
                    } catch {}
                }

                pedidos[produto] = [];

                return interaction.reply({ content: "✅ Todos foram avisados!", ephemeral: true });
            }

            // 📦 LISTA DE ESPERA (CORRIGIDO)
            if (produtos.includes(id)) {

                const produto = id;

                if (!pedidos[produto]) pedidos[produto] = [];

                if (pedidos[produto].includes(interaction.user.id)) {
                    return interaction.reply({ content: "⚠️ Você já está na lista!", ephemeral: true });
                }

                pedidos[produto].push(interaction.user.id);

                const canal = await client.channels.fetch(CANAL_NOTIFICACAO);
                if (canal) {
                    canal.send(`📢 ${interaction.user.tag} pediu ${produto}`);
                }

                return interaction.reply({
                    content: `✅ Você entrou na lista de ${produto}`,
                    ephemeral: true
                });
            }
        }

        // ================= COMANDOS =================
        if (interaction.isChatInputCommand()) {

            // 🛒 COMPRAR
            if (interaction.commandName === "comprar") {

                const embed = new EmbedBuilder()
                    .setTitle("🛒 𝑻𝑰𝑪𝑲𝑬𝑻 𝑪𝑶𝑴𝑷𝑹𝑨")
                    .setDescription("Clique abaixo para iniciar sua compra")
                    .setColor("Green");

                const botao = new ButtonBuilder()
                    .setCustomId("abrir_ticket")
                    .setLabel("🛒 Comprar")
                    .setStyle(ButtonStyle.Success);

                return interaction.reply({
                    embeds: [embed],
                    components: [new ActionRowBuilder().addComponents(botao)]
                });
            }

            // 📦 PAINEL
            if (interaction.commandName === "painel") {

                const rows = [];

                for (let i = 0; i < produtos.length; i += 5) {
                    const row = new ActionRowBuilder();

                    produtos.slice(i, i + 5).forEach(p => {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(p)
                                .setLabel(`${emojis[p]} ${p}`)
                                .setStyle(ButtonStyle.Primary)
                        );
                    });

                    rows.push(row);
                }

                return interaction.reply({
                    content: "📦 Produtos sem estoque:",
                    components: rows
                });
            }

            // 🔥 PAINEL ADMIN (CORRIGIDO)
            if (interaction.commandName === "painel_admin") {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.reply({
                        content: "❌ Apenas administradores!",
                        ephemeral: true
                    });
                }

                const rows = [];

                for (let i = 0; i < produtos.length; i += 5) {
                    const row = new ActionRowBuilder();

                    produtos.slice(i, i + 5).forEach(p => {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`estoque_${p}`)
                                .setLabel(`🔥 ${p}`)
                                .setStyle(ButtonStyle.Success)
                        );
                    });

                    rows.push(row);
                }

                return interaction.reply({
                    content: "🔥 Painel admin:",
                    components: rows,
                    ephemeral: true
                });
            }

            // 🗑️ LIXO (CORRIGIDO)
            if (interaction.commandName === "lixo") {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.reply({
                        content: "❌ Apenas admin!",
                        ephemeral: true
                    });
                }

                const canal = await client.channels.fetch(CANAL_NOTIFICACAO);
                const msgs = await canal.messages.fetch({ limit: 100 });

                await canal.bulkDelete(msgs, true).catch(() => {});

                return interaction.reply({
                    content: "🗑️ Notificações apagadas!",
                    ephemeral: true
                });
            }
        }

    } catch (err) {
        console.error("ERRO:", err);
    }

});

client.login(TOKEN);