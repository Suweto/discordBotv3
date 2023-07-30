const {CommandInteraction,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle} = require('discord.js');
const model = require('../../Models/models.js')
module.exports = {
    name:"interactionCreate",

    async execute(interaction,client){
        if(!interaction.isModalSubmit()) return;
        if(!interaction.customId.startsWith('store')) return;
        const separeteId = interaction.customId.split(',');
        const customId = separeteId[1];
        const guildDb = await model.guild.findOne({guildId:interaction.guild.id});
        const userDb = guildDb.users.find(user=>user.userId == interaction.user.id); 
        switch (customId) {
            case "removeitem":
                if(userDb.cart.isBuying == true){
                    let removeitemr1 = interaction.fields.getTextInputValue("removeitemp1");
                    let removeitemr2 = interaction.fields.getTextInputValue("removeitemp2");
                    const item = userDb.cart.products.find(item=>item.productName == removeitemr1);
                    if(item != null){
                        let n = parseInt(removeitemr2);
                        if((isNaN(n))){
                            interaction.reply({content:`Você digitou "${removeitemr2}" que é uma caractere proibida na opção "Quantidade", tente novamente com um numero.`,ephemeral:true})
                            return;
                        }else if(n <= 0){
                            interaction.reply({content:`O numero "${n}"" que você digitou não é válido, digite um numero superior ou igual a 1`,ephemeral:true})
                            return;
                        }
                        if(n >=item.productQuantity) {
                            n = item.productQuantity;
                            await model.guild.updateOne(
                                {guildId:interaction.guild.id,"users.userId":interaction.user.id},
                                {$pull:{"users.$.cart.products":{productName:item.productName}},$set:{"users.$.cart.total":(item.productQuantity * -item.productPrice)+ userDb.cart.total}},
                                );
                        }
                        const field = await toFields(interaction);
                        const embedCart = new EmbedBuilder()
                        .setTitle("| Área de compra")
                        .addFields(field);
                        const finalButtonCart = new ButtonBuilder()
                        .setLabel("Finalizar Compra")
                        .setEmoji('🛒')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId("store,final");
                        const removerItemButtonCart = new ButtonBuilder()
                        .setCustomId("store,removeitem")
                        .setEmoji('✖')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel("Remover item do carrinho");
                        const cancelBuyButtonCart = new ButtonBuilder()
                        .setCustomId('store,cancelbuy')
                        .setEmoji('❎')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel("Cancelar Compra");
                        const rowCart = new ActionRowBuilder().addComponents(finalButtonCart).addComponents(removerItemButtonCart).addComponents(cancelBuyButtonCart);
                        let channelCart = await client.channels.fetch(userDb.cart.channel);
                        const msgCart = await channelCart.messages.fetch(userDb.cart.msg);
                        msgCart.edit({embeds:[embedCart],components:[rowCart]});
                        interaction.reply({content:`Você removeu com sucesso o item ${item.productName} e ${n} Unidades`,ephemeral:true})
                    }
                    else if(item == null){
                        interaction.reply({content:`O item ${removeitemr1} que você está tentando remover não exite ou você digitou errado.`,ephemeral:true});
                    }
                }
                return;
                break;
                case 'cupom':
                    let cupomr1 = interaction.fields.getTextInputValue("cupomp1");
                    const cupomGuild = guildDb.cupom.find(cupom=>cupom.cupomName == cupomr1);
                    if(cupomGuild != null){
                        const total2 = (userDb.cart.total * (1-(cupomGuild.cupomPorcentage/100))).toFixed(2); 
                        
                        const newGuildDB = await model.guild.findOneAndUpdate(
                            {guildId:interaction.guild.id},
                            {$set:
                                {"users.$[user].cart.cupom":{cupomName:cupomGuild.cupomName,cupomPorcentage:cupomGuild.cupomPorcentage},"users.$[user].cart.total2":total2}},
                            {arrayFilters:[{'user.userId':interaction.user.id}]},)
                        let fields = await toFields(interaction);
                        
                        fields.pop();
                        
                        fields.push({name:`~~ Antigo Preço Total:~~`,value:`~~R$${userDb.cart.total}~~`,inline:true});
                        fields.push({name:`Novo Preço Total:`,value:`R$${total2}`,inline:true});
                        fields.push({name:`Cupom usado:`,value:`**${cupomGuild.cupomName}** com **${cupomGuild.cupomPorcentage}%** de desconto`,inline:true});
                        
                        const cupomEmbed = new EmbedBuilder()
                            .setColor('Random')
                            .setAuthor({name:`${interaction.guild.name}`})
                            .setTitle("| Área de finalização de compra")
                            .addFields(fields)
                        const qrcodeButtonFinal = new ButtonBuilder()
                            .setCustomId("store,qrcode")
                            .setEmoji('1135085636668358676')
                            .setLabel('Gerar QRCode pix')
                            .setStyle(ButtonStyle.Success)
                    
                        const cancelButtonFInal = new ButtonBuilder()
                            .setCustomId('store,cancelbuy')
                            .setEmoji('❎')
                            .setLabel("Cancelar Compra")
                            .setStyle(ButtonStyle.Danger);
                        const row = new ActionRowBuilder().addComponents(qrcodeButtonFinal).addComponents(cancelButtonFInal)
                        const channelCart = await client.channels.fetch(userDb.cart.channel);
                        const msgCart = await channelCart.messages.fetch(userDb.cart.msg);
                        await msgCart.edit({embeds:[cupomEmbed],components:[row]});
                        interaction.reply({content:`O cupom foi adicionado com sucesso`,ephemeral:true})
                    }else if(cupomGuild == null){
                        interaction.reply(`O cupom ${cupomGuild} que você digitou é inválido.\nVerifique se você escreveu certo ou esse cupom não existe`);
                    }
                    
                    break;
            default:
                break;
        }
    }
}
async function toFields(interaction){
    let array = []
    const guildDb = await model.guild.findOne(
        {guildId:interaction.guild.id},
    )
    const userDb = guildDb.users.find(user=>user.userId === interaction.user.id);
    for(const item of userDb.cart.products){
        array.push(
            {name:`Item`,value:`${item.productName}`,inline:true},
            {name:`preço de todas as unidades`,value:`R$${item.productPrice * item.productQuantity}`,inline:true},
            {name:`Quantidade:`,value:`${item.productQuantity} Unidades`,inline:true},
            {name:`\u200B`,value:`\u200B`});
    }
        array.push({name:`Preço Total:`,value:`R$${userDb.cart.total}`,inline:true})
    
    return array;
}