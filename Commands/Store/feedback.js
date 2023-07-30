const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder,ButtonBuilder,ActionRowBuilder, ButtonStyle} = require('discord.js');
const model = require("../../Models/models.js");
module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Limpa uma quantidade especifica de mensagens")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option=>
        option
            .setName("userfeedback")
            .setDescription("Usuario que vai receber o pedido de feedback")
            .setRequired(true)),
    
    async execute(interaction){
        const user = interaction.options.getUser("userfeedback");
        const guildDB= await model.guild.findOne({guildId:interaction.guild.id});
        const userDB = guildDB.users.find(userId=> userId.userId == user.id);
        if(userDB == null){
            interaction.reply({content:`Você digitou um usuario que não está no banco de dados`,ephemeral:true});
            return;
        }
        if(userDB.cart.isBuying == false){
            interaction.reply({content:`Você digitou um usuario que não está em uma compra`,ephemeral:true})
        }
        if(userDB.cart.isFinal == true){
            const channel = userDB.cart.channel;
            const embed = new EmbedBuilder()
                .setAuthor({name:`${interaction.guild.name}`})
                .setTitle(`| FeedBack`)
                .setColor('Random')
                .setDescription("Faça um FeedBack para ajudar a nossa loja")
            const buttonFeedBack = new ButtonBuilder()
                .setCustomId("store,feedback")
                .setEmoji('⭐')
                .setLabel("FeedBack")
                .setStyle(ButtonStyle.Success)
            const closeTicket = new ButtonBuilder()
                .setCustomId("store,closeticket")
                .setEmoji("❎")
                .setLabel("Fechar Ticket")
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(buttonFeedBack).addComponents(closeTicket);
            const channelCart = await interaction.client.channels.fetch(channel);
            channelCart.send({content:`<@${userDB.userId}>`,embeds:[embed],components:[row]});
        }

    }
}