require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const { createCanvas } = require("@napi-rs/canvas");
const path = require("path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

const sessions = new Map();

const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  yellow: 0xfee75c,
};

function randomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function createCaptchaImage(code) {
  const width = 760;
  const height = 230;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#30343d";
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  // Ruído visual
  for (let i = 0; i < 55; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  ctx.font = "bold 86px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = code.split("");
  const spacing = 100;
  const startX = width / 2 - ((chars.length - 1) * spacing) / 2;

  chars.forEach((char, i) => {
    ctx.save();
    ctx.translate(startX + i * spacing, height / 2);
    ctx.rotate((Math.random() - 0.5) * 0.25);
    ctx.fillStyle = "#f5f5f5";
    ctx.shadowColor = "rgba(255,255,255,.25)";
    ctx.shadowBlur = 8;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  return canvas.toBuffer("image/png");
}

function buildStartMessage() {
  const embed = new EmbedBuilder()
    .setColor('#168CFF')
    .setTitle("🔐 VERIFICAÇÃO CAPTCHA")
    .setDescription(
      "Para acessar o **Capital V Roleplay**, conclua a verificação abaixo.\n\n" +
      "🛡️ **Proteção contra bots**\n" +
      "⏱️ **Você tem 1 minuto** para concluir.\n" +
      "✅ Após a aprovação, seu acesso será liberado automaticamente."
    )
    .setImage("attachment://banner.png")
    .setFooter({ text: "Capital V Roleplay • Sistema de verificação" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("captcha_start")
      .setLabel("Iniciar verificação")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId("captcha_help")
      .setLabel("Como funciona")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("❔")
  );

  return { embeds: [embed], components: [row] };
}

function buildHelpMessage() {
  return new EmbedBuilder()
    .setColor(COLORS.yellow)
    .setTitle("Por que usamos CAPTCHA?")
    .setDescription(
      "1. 🛡️ **Proteção contra bots.**\n" +
      "2. 👥 **Ajuda a garantir membros reais.**\n" +
      "3. 📜 **Mantém o processo de entrada organizado.**\n\n" +
      "Ao iniciar, será mostrada uma imagem com um código. " +
      "Selecione no menu a opção que corresponde exatamente ao código da imagem."
    );
}

async function registerCommands() {
  const command = new SlashCommandBuilder()
    .setName("setup-captcha")
    .setDescription("Envia o painel de verificação CAPTCHA neste canal.");

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: [command.toJSON()] }
  );
}

client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ Online como ${bot.user.tag}`);

  try {
    await registerCommands();
    console.log("✅ /setup-captcha registrado.");
  } catch (error) {
    console.error("Erro ao registrar comando:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // /setup-captcha
    if (interaction.isChatInputCommand() && interaction.commandName === "setup-captcha") {
      if (!interaction.memberPermissions?.has("ManageGuild")) {
        return interaction.reply({
          content: "❌ Você precisa da permissão **Gerenciar Servidor**.",
          ephemeral: true,
        });
      }

      if (
        process.env.CAPTCHA_CHANNEL_ID &&
        interaction.channelId !== process.env.CAPTCHA_CHANNEL_ID
      ) {
        return interaction.reply({
          content: `❌ Use este comando no canal <#${process.env.CAPTCHA_CHANNEL_ID}>.`,
          ephemeral: true,
        });
      }

      const banner = new AttachmentBuilder(
        path.join(__dirname, "../assets/banner.png"),
        { name: "banner.png" }
      );

      await interaction.channel.send({
        ...buildStartMessage(),
        files: [banner],
      });

      return interaction.reply({
        content: "✅ Painel de CAPTCHA enviado.",
        ephemeral: true,
      });
    }

    // Botão "Como funciona"
    if (interaction.isButton() && interaction.customId === "captcha_help") {
      return interaction.reply({
        embeds: [buildHelpMessage()],
        ephemeral: true,
      });
    }

    // Botão "Iniciar verificação"
    if (interaction.isButton() && interaction.customId === "captcha_start") {
      const code = randomCode(6);
      const options = shuffle([
        code,
        randomCode(6),
        randomCode(6),
        randomCode(6),
        randomCode(6),
      ]);

      const image = createCaptchaImage(code);
      const attachment = new AttachmentBuilder(image, {
        name: "captcha.png",
      });

      // Cancela sessão anterior do mesmo usuário.
      const old = sessions.get(interaction.user.id);
      if (old?.timeout) clearTimeout(old.timeout);

      const timeout = setTimeout(() => {
        sessions.delete(interaction.user.id);
      }, 60_000);

      sessions.set(interaction.user.id, {
        code,
        timeout,
        createdAt: Date.now(),
      });

      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle("Verificação CAPTCHA")
        .setDescription(
          "Para verificar que você não é um robô, selecione o código correto exibido na imagem abaixo."
        )
        .setImage("attachment://captcha.png")
        .setFooter({ text: "Você tem 1 minuto para concluir a verificação." });

      const menu = new StringSelectMenuBuilder()
        .setCustomId("captcha_select")
        .setPlaceholder("Selecione o código correto")
        .addOptions(
          options.map((value) => ({
            label: value,
            value,
          }))
        );

      const row = new ActionRowBuilder().addComponents(menu);

      return interaction.reply({
        embeds: [embed],
        files: [attachment],
        components: [row],
        ephemeral: true,
      });
    }

    // Seleção do CAPTCHA
    if (interaction.isStringSelectMenu() && interaction.customId === "captcha_select") {
      const session = sessions.get(interaction.user.id);

      if (!session) {
        return interaction.update({
          content: "⏰ Seu CAPTCHA expirou. Clique em **Iniciar verificação** novamente.",
          embeds: [],
          components: [],
        });
      }

      const selected = interaction.values[0];

      if (selected !== session.code) {
        clearTimeout(session.timeout);
        sessions.delete(interaction.user.id);

        return interaction.update({
          content: "❌ **CAPTCHA incorreto.** Inicie a verificação novamente.",
          embeds: [],
          components: [],
        });
      }

      clearTimeout(session.timeout);
      sessions.delete(interaction.user.id);

      const roleId = process.env.VERIFY_ROLE_ID;
      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!roleId) {
        return interaction.update({
          content:
            "⚠️ CAPTCHA correto, mas o `VERIFY_ROLE_ID` ainda não foi configurado no `.env`.",
          embeds: [],
          components: [],
        });
      }

      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(roleId, "CAPTCHA concluído");
      }

      // Remove o cargo de Não Verificado após a verificação.
      const removeRoleId = process.env.REMOVE_ROLE_ID;
      if (removeRoleId && member.roles.cache.has(removeRoleId)) {
        await member.roles.remove(
          removeRoleId,
          "CAPTCHA concluído - cargo de não verificado removido"
        );
      }

      return interaction.update({
        content: "✅ **Verificação concluída!** Seu acesso foi liberado.",
        embeds: [],
        components: [],
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocorreu um erro ao processar a verificação.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
