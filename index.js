client.on(Events.InteractionCreate, async interaction => {

    try {

        // ================= BOTÕES =================
        if (interaction.isButton()) {

            await interaction.deferReply({ ephemeral: true }); // 🔥 ESSENCIAL

            const id = interaction.customId;

            // 🎫 ABRIR TICKET
            if (id === "abrir_ticket") {

                const existente = interaction.guild.channels.cache.find(c =>
                    c.name === `ticket-${interaction.user.id}`
                );

                if (existente) {
                    return interaction.editReply("⚠️ Você já tem um ticket aberto!");
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

                return interaction.editReply("✅ Ticket criado!");
            }

            // 🔒 FECHAR TICKET
            if (id === "fechar_ticket") {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.editReply("❌ Apenas administradores!");
                }

                await interaction.editReply("🔒 Fechando em 3s...");

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 3000);

                return;
            }

            // 🔔 AVISO ESTOQUE
            if (id.startsWith("estoque_")) {

                if (!interaction.member.roles.cache.has(CARGO_ADMIN)) {
                    return interaction.editReply("❌ Apenas admin!");
                }

                const produto = id.replace("estoque_", "");

                if (!pedidos[produto] || pedidos[produto].length === 0) {
                    return interaction.editReply("⚠️ Ninguém pediu esse produto.");
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

                return interaction.editReply("✅ Todos foram avisados!");
            }

            // 📦 LISTA
            if (produtos.includes(id)) {

                const produto = id;

                if (!pedidos[produto]) pedidos[produto] = [];

                if (pedidos[produto].includes(interaction.user.id)) {
                    return interaction.editReply("⚠️ Você já está na lista!");
                }

                pedidos[produto].push(interaction.user.id);

                const canal = await client.channels.fetch(CANAL_NOTIFICACAO);
                if (canal) {
                    canal.send(`📢 ${interaction.user.tag} pediu ${produto}`);
                }

                return interaction.editReply(`✅ Você entrou na lista de ${produto}`);
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

            // 🔥 PAINEL ADMIN
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

            // 🗑️ LIXO
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