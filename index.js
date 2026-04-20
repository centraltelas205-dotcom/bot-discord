if (interaction.isButton()) {

    const id = interaction.customId;

    // 👇 RESPONDE IMEDIATO (sem quebrar)
    await interaction.deferReply({ ephemeral: true });

    // pega membro atualizado
    const member = await interaction.guild.members.fetch(interaction.user.id);

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

        await canal.send(`🎫 ${interaction.user}, descreva seu pedido.`);

        return interaction.editReply("✅ Ticket criado!");
    }

    // 🔒 FECHAR
    if (id === "fechar_ticket") {

        if (!member.roles.cache.has(CARGO_ADMIN)) {
            return interaction.editReply("❌ Apenas admin!");
        }

        await interaction.editReply("🔒 Fechando...");

        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 3000);

        return;
    }

    // 🔔 ESTOQUE
    if (id.startsWith("estoque_")) {

        if (!member.roles.cache.has(CARGO_ADMIN)) {
            return interaction.editReply("❌ Apenas admin!");
        }

        const produto = id.replace("estoque_", "");

        if (!pedidos[produto] || pedidos[produto].length === 0) {
            return interaction.editReply("⚠️ Ninguém pediu.");
        }

        for (const userId of pedidos[produto]) {
            try {
                const user = await client.users.fetch(userId);
                await user.send(`🔥 ${produto} voltou ao estoque!`);
            } catch {}
        }

        pedidos[produto] = [];

        return interaction.editReply("✅ Avisado!");
    }

    // 📦 LISTA
    if (produtos.includes(id)) {

        if (!pedidos[id]) pedidos[id] = [];

        if (pedidos[id].includes(interaction.user.id)) {
            return interaction.editReply("⚠️ Já está na lista!");
        }

        pedidos[id].push(interaction.user.id);

        return interaction.editReply(`✅ Você entrou na lista de ${id}`);
    }
}