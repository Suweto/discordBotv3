const {SlashCommandBuilder,CommandInteraction,ButtonBuilder,ActionRowBuilder,PermissionFlagsBits, ButtonStyle} = require('discord.js');
const model = require('../../Models/models.js');
module.exports = {
    data: new SlashCommandBuilder()
    .setName("createbuy")
    .setDescription("Cria a msg de compra")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option=>
        option
            .setName('product')
            .setDescription('Produto que será vendido')
            .setRequired(true)),
    async execute(interaction){
        const productInteraction = interaction.options.getString('product')?.toLowerCase();
        const products = await model.guild.findOne({guildId:interaction.guild.id});
        
        const product = products.products.find(product => product.productName === productInteraction);
        if(product == null){
            await interaction.reply({content:`O produto ${productInteraction} que você tentou usar não existe\nTente novamente ou use o /create-product`,ephemeral:true})
            return;
        }

        const {channel} = interaction
        const message = await channel.messages.fetch({limit:1});
        const lastMessage = await message.last();

        const buyButton = new ButtonBuilder()
            .setCustomId(`store,addcart${product.productName}`)
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Success)
            .setLabel(`Adicionar no Carrinho ${toCap(product.productName)}`)

        const supportButton = new ButtonBuilder()
            .setCustomId('support')
            .setEmoji('🆘')
            .setStyle(ButtonStyle.Primary)
            .setLabel("Support")
        const row = new ActionRowBuilder().addComponents(buyButton).addComponents(supportButton);
        console.log(lastMessage.embeds);
        try{
        channel.send({embeds:[lastMessage.embeds[0]],components:[row]});
        }
        catch(e){
            console.error("Houve um erro aqui",e);
        }
    }
}

function toCap(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
}