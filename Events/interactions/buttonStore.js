const {CommandInteraction,TextInputStyle,ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder} = require('discord.js');
const model = require('../../Models/models.js');

const mercadoPago = require('mercadopago');
const dotenv = require('dotenv');
dotenv.config()
const {TOKEN_API} = process.env;
const fs = require('fs');
const axios = require('axios');
module.exports = 
{
    name:"interactionCreate",

    async execute(interaction,client)
    {
        if(!interaction.isButton()) return;
        if(!interaction.customId.startsWith('store')) return;
        let customId = interaction.customId;
        const a = customId.split(',');
        customId = a[1]

        // START -- - -- -- - -

        // Verificação de usuario da loja

        let guildDB = await model.guild.findOne({guildId:interaction.guild.id})
        let userDb = guildDB.users.find(user=> user.userId === interaction.user.id);

        if(!guildDB.status && customId != "support"){
            interaction.reply({content:"A loja está fechada. Aguarde algum moderador abri-la.",ephemeral:true})
            return;
        }
        
        if(userDb == null){
            guildDB = await model.guild.findOneAndUpdate(
                {guildId:interaction.guild.id},
                {$push:
                    {users:
                        {   
                            userId:interaction.user.id,
                            balance: 0,
                            support:
                            {
                                isOpen:false,
                                channel:null,
                            },
                            cart:{
                                
                                isBuying: false,
                                isFinal:false,
                                channel: null,
                                msg: null,
                                cupom: {},
                                total: null,
                                total2: null,
                                products:
                                [
                                ]
                        }}
                    }
                },
                {new:true}
                )
            userDb = guildDB.users.find(user=> user.userId === interaction.user.id);
        }
        // Verificação de usuario da loja
        
        // Verificação de Produto Da loja
        let product;
        if(customId.startsWith('addcart')){
            const productName = customId.replace('addcart','');
            product = guildDB.products.find(product=>product.productName == productName)
            customId = 'addcart';

        }
        // Verificação de Produto Da loja
        
        
        switch(customId){
            case 'addcart':
                if(userDb.cart.isBuying == false){
                    await model.guild.updateOne(
                        {guildId:interaction.guild.id,'users.userId':interaction.user.id},
                        {$set:{'users.$.cart.isBuying':true,}}
                    )
                    const channel = await interaction.guild.channels.create(
                        {
                            name: `cart-${interaction.user.username}`,
                            type: ChannelType.GuildText,
                            permissionOverwrites:[
                                {
                                    id: interaction.user.id,
                                    allow:["ViewChannel"]
                                },
                                {
                                    id: interaction.guild.roles.everyone.id,
                                    deny:["ViewChannel"]
                                }
                            ]
                        }
                    );
                    const embedBuy = new EmbedBuilder()
                        .setTitle("| Área de compra")
                        .setColor('Random')
                        .addFields(
                            [
                                {
                                    name:`Item`,
                                    value:`${product.productName}`,
                                    inline:true
                                },
                                {
                                    name:`Preço`,
                                    value:`R$${product.productPrice}`,
                                    inline:true
                                },
                                {
                                    name:`Quantitdade`,
                                    value:`${1}`,
                                    inline:true
                                }
                            ]
                        );
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
                    const msg = await channel.send({content:`<@${userDb.userId}>`,embeds:[embedBuy],components:[rowCart]});
                    await interaction.reply({content:`O seu carrinho de comprar foi criado em <#${channel.id}>`,ephemeral:true});
                    
                    await model.guild.updateOne(
                        {guildId:interaction.guild.id,'users.userId':interaction.user.id},
                        {$set:{
                            'users.$.cart.itens':1,
                            'users.$.cart.channel':channel.id,
                            'users.$.cart.total':product.productPrice,
                            'users.$.cart.products':{productName:product.productName,productPrice:product.productPrice,productQuantity:1},
                            'users.$.cart.msg':msg.id}}
                    );
                }else if(userDb.cart.isBuying == true && userDb.cart.isFinal == false){
                    while (userDb.cart.channel == null) {
                        try{
                        
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        guildDB = await model.guild.findOne({guildId:interaction.guild.id})
                        userDb = guildDB.users.find(user=>user.userId == interaction.user.id);
                    }
                    catch(e){
                        console.error(e);
                        await interaction.reply({content:`Houve um erro, tente novamente`,ephemeral:true});
                        return;
                    }
                }
                    const x = await addTocart(interaction,userDb,product);
                    if(x) return;
                    const field = await toFields(interaction)
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
                    interaction.reply({content:`O item ${product.productName} foi adicionado em seu carrinho <#${userDb.cart.channel}>`,ephemeral:true});

                }else if(userDb.cart.isFinal == true){
                    interaction.reply({content:`Você já está finalizando uma compra <#${userDb.cart.channel}>! Cancele ela para poder adicionar mais produtos`,ephemeral:true})
                }
                break;
            case 'cancelbuy':
                const cancelChannel = userDb.cart.channel;
                const cancelChannel2 = await client.channels.fetch(cancelChannel);
                await cancelChannel2.delete()
                await model.guild.updateOne(
                    {guildId:interaction.guild.id,"users.userId":interaction.user.id},
                    {$set:
                        {"users.$.cart":
                            {   
                                
                                    
                                isBuying: false,
                                isFinal:false,
                                channel: null,
                                itens:null,
                                msg: null,
                                cupom: {},
                                total: null,
                                total2: null,
                                products:[]
                            }
                        }
                    },);
                await cancelMSG(interaction);
                break;
                case "removeitem":
                    const removeitem = new ModalBuilder()
                        .setCustomId("store,removeitem")
                        .setTitle("Remover itens do carrinho")
                    const removeitemp1 = new TextInputBuilder()
                        .setCustomId("removeitemp1")
                        .setLabel("Escreva o nome do produto (Exatamente igual)")
                        .setMaxLength(30)
                        .setMinLength(1)
                        .setRequired(true)
                        .setPlaceholder("Ex. spotify")
                        .setStyle(TextInputStyle.Short);
                    const removeitemp2 = new TextInputBuilder()
                        .setCustomId("removeitemp2")
                        .setLabel("Quantidade que irá ser removida")
                        .setMaxLength(2)
                        .setMinLength(1)
                        .setPlaceholder("Ex. 1")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short);
                        removeitem.addComponents(
                            new ActionRowBuilder().addComponents(removeitemp1),
                            new ActionRowBuilder().addComponents(removeitemp2)
                        );
                        interaction.showModal(removeitem);
                    break;
                case 'final':
                    await model.guild.updateOne(
                        {guildId:interaction.guild.id,'users.userId':interaction.user.id},
                        {$set:{"users.$.cart.isFinal":true}});
                    const field = await toFields(interaction);
                    const finalEmbed = new EmbedBuilder()
                        .setTitle(`| Área de finalização de compra`)
                        .setDescription("Nessa área você não pode mais adicionar produtos no carrinho")
                        .addFields(field)
                    const qrcodeButtonFinal = new ButtonBuilder()
                            .setCustomId("store,qrcode")
                            .setEmoji('1135085636668358676')
                            .setLabel('Gerar QRCode pix')
                            .setStyle(ButtonStyle.Success)
                    const cupomButtonFinal = new ButtonBuilder()
                            .setCustomId('store,cupom')
                            .setEmoji('🎫')
                            .setLabel("Usar Cupom")
                            .setStyle(ButtonStyle.Primary)
                    const cancelButtonFInal = new ButtonBuilder()
                            .setCustomId('store,cancelbuy')
                            .setEmoji('❎')
                            .setLabel("Cancelar Compra")
                            .setStyle(ButtonStyle.Danger);
                    const row = new ActionRowBuilder().addComponents(qrcodeButtonFinal).addComponents(cupomButtonFinal).addComponents(cancelButtonFInal);
                    const channelCart = await client.channels.fetch(userDb.cart.channel);
                    const msgCart = await channelCart.messages.fetch(userDb.cart.msg);
                    msgCart.edit({embeds:[finalEmbed],components:[row]})
                    interaction.reply({content:"finalizar Compra",ephemeral:true})
                    break;
                case 'cupom':

                    const cupomModal = new ModalBuilder()
                        .setCustomId('store,cupom')
                        .setTitle("Usar um Cupom");
                    const cupomModalp1 = new TextInputBuilder()
                        .setPlaceholder('Coloque o seu cupom aqui')
                        .setLabel("Escreva o seu Cupom para usar")
                        .setMaxLength(20)
                        .setRequired(true)
                        .setMinLength(3)
                        .setStyle(TextInputStyle.Short)
                        .setCustomId('cupomp1');
                    cupomModal.addComponents(new ActionRowBuilder().addComponents(cupomModalp1));
                    interaction.showModal(cupomModal);
                    break;
                case 'qrcode':
                    guildDB = await model.guild.findOne({guildId:interaction.guild.id});
                    
                    userDb = guildDB.users.find(user=> user.userId == interaction.user.id);
                    let price;
                    if(userDb.cart.total2 == null){
                        price = userDb.cart.total.toFixed(2);
                    }else{
                        price = userDb.cart.total2.toFixed(2);
                    }
                    
                    const payment_data = {
                        transaction_amount: parseFloat(price),
                        description: `Pagamento - ${interaction.user.username}`,
                        payment_method_id: 'pix',
                        payer: {
                            email: 'paulaguimaraes2906@gmail.com',
                            first_name: 'Paula',
                            last_name: 'Guimaraes',
                            identification: {
                                type: 'CPF',
                                number: '07944777984'
                            },
                            address: {
                                zip_code: '06233200',
                                street_name: 'Av. das Nações Unidas',
                                street_number: '3003',
                                neighborhood: 'Bonfim',
                                city: 'Osasco',
                                federal_unit: 'SP'
                            }
                        },
                    }
                    
                    mercadoPago.configurations.setAccessToken(process.env.TOKEN_API);
                mercadoPago.payment.create(payment_data).then(async function(data){
                        const imgBuffer = Buffer.from(data.body.point_of_interaction.transaction_data.qr_code_base64, 'base64');
                        const copy = data.body.point_of_interaction.transaction_data.qr_code;
                        const pathQRCode = `./pix/${interaction.user.username}qrcode.png`;
                        const pathQRCodeWrited = `./pix/${interaction.user.username}qrcode.txt`;
                        try{
                            
                            fs.writeFileSync(pathQRCode,imgBuffer);
                            fs.writeFileSync(pathQRCodeWrited,copy);
                        }catch(e){
                            console.error("Erro ao criar o arquivo",e);
                        }

                        
                    const embed = new EmbedBuilder()
                        .setTitle(`${interaction.user.username}| Sistema de pagamento`)
                        .setDescription(`${data.body.point_of_interaction.transaction_data.qr_code}`)
                        .setColor("Green")
                        .setFooter({text: "Você tem 10 minutos para efetuar o pagamento"})
                    interaction.reply({ embeds: [embed],files:[pathQRCode],ephemeral: false }).then(msg => 
                            {
                                let contador = 0;
                                const tempoTotal = 600000;
                                const intervaloExecucao= 10000;
                                
                                const loop = setInterval(async() => {
                                    axios.get(`https://api.mercadolibre.com/collections/notifications/${data.body.id}`, {
                                        headers: {
                                            'Authorization': `Bearer ${TOKEN_API}`
                                            }
                                    }).then(async(doc)=>{
                                        if(doc.data.collection.status === "approved"){
                                            clearInterval(loop);
                                            await interaction.channel.bulkDelete(7);
                                            const embedEntrega = new EmbedBuilder()
                                                .setAuthor({name:`${interaction.guild.name}`})
                                                .setTitle(`| Compra Aprovada!!`)
                                                .setColor('Green')
                                                .setTimestamp(new Date())
                                                .setDescription("Obrigado por comprar com a gente\nAguarde algum membro da moderação vir entregar o seu produto")
                                                .addFields(
                                                    [
                                                        {
                                                            name:`Id da sua compra`,
                                                            value:`${data.body.id}`,
                                                            inline:true,
                                                        },
                                                        
                                                    ]
                                                )
                                                .setFooter({text:`A entrega será feita em até 24h`});
                                            await interaction.channel.send({embeds:[embedEntrega]});
                                            const membro = interaction.guild.members.cache.get(interaction.user.id);
                                            const removeRole = interaction.guild.roles.cache.find(role=>role.id === guildDB.welcome.welcomeRole);
                                            const addRole = interaction.guild.roles.cache.find(role=>role.id === guildDB.clienteRole);
                                            await membro.roles.add(addRole);
                                            await membro.roles.remove(removeRole);

                                            const boosterRole = guildDB.booster.boosterRole;
                                            if(boosterRole){
                                                const membroBooster = membro.roles.cache.some(role=> role.id == boosterRole);
                                                if(membroBooster){
                                                    
                                                }
                                            }
                                            
                                            const list =[
                                                {
                                                    name: `Id da Compra do Mercado Pago`,
                                                    value: `${data.body.id}`,
                                                    inline: false
                                                },
                                                {
                                                    name:`Comprador`,
                                                    value: `<@${interaction.user.id}>`,
                                                    inline:true
                                                },
                                                {
                                                    name:`Comprador ID`,
                                                    value: `${interaction.user.id}`,
                                                    inline:true
                                                },
                                                
                                            ]
                                            const userT = userDb.cart.cupom.cupomName
                                            if(userT != null){
                                                list.push({name:`Valor Total Antigo`,value:`R$${userDb.cart.total}`,inline:true});
                                                list.push({name:`Cupom usado`,value:`${userDb.cart.cupom.cupomName} com ${userDb.cart.cupom.cupomPorcentage}% de desconto`,inline:true});
                                                list.push({name:`Valor total pago com desconto`,value:`R$${userDb.cart.total2}`,inline:true});
                                            }else if(userT == null){
                                                list.push({name:`Valor Total Pago`,value:`R$${userDb.cart.total}`,inline:true});
                                                list.push({name:`Cupom usado`,value:`Não foi usado cupom`,inline:true});
                                                list.push({name:`\u200B`,value:`\u200B`,inline:true});
                                            }
                                            function validarCompras(){
                                                let a = [];
                                                for(const item of userDb.cart.products){
                                                    a.push({name:`\u200B`,value:`\u200B`});
                                                    a.push({name:`item comprado`,value:`${item.productName}`,inline:true});
                                                    a.push({name:`Quantidade`,value:`${item.productQuantity} Unidades`,inline:true})
                                                    a.push({name:`Preço por Unidade`,value:`R$${item.productPrice}`,inline:true})
                                                }
                                                return a;
                                            }
                                            list.push(...validarCompras());
                                            const compraAprovada = new EmbedBuilder()
                                                .setColor('Gold')
                                                .setThumbnail(interaction.user.avatarURL())
                                                .setAuthor({name:`${interaction.guild.name}`})
                                                .setTitle("| Compra Aprovada")
                                                .setFields(list);
                                            const channelCart = await client.channels.fetch(guildDB.proofChannel);
                                            channelCart.send({embeds:[compraAprovada]});
                                            fs.unlink(pathQRCodeWrited,(error)=>{
                                                if(error){
                                                    console.log("Houve um erro ao tentar apagar o arquivo");
                                                }
                                            })
                                            fs.unlink(pathQRCode, (error)=>{
                                                if(error){
                                                    console.log("Houve um erro ao tentar apagar o arquivo");
                                                }
                                            })
                                        }
                                    })


                                    //Cancelando o loop
                                    contador++;
                                    if(contador*intervaloExecucao >= tempoTotal){
                                        clearInterval(loop)
                                        await cancelMSG(interaction);
                                    fs.unlink(pathQRCodeWrited,(error)=>{
                                        if(error){
                                        console.log("Houve um erro ao tentar apagar o arquivo");
                                                                    }
                                    })
                                    fs.unlink(pathQRCode, (error)=>{
                                        if(error){
                                            console.log("Houve um erro ao tentar apagar o arquivo");
                                        }
                                    })
                                    }
                                }, intervaloExecucao);
                                
                            })
                })
                    break;
                case 'feedback':
                    const feedbackModal = new ModalBuilder()
                        .setCustomId("store,feedback")
                        .setTitle(`FeedBack ${interaction.guild.name}`);
                    const feedbackP1 = new TextInputBuilder()
                        .setCustomId("feedbackp1")
                        .setLabel("De 1 à 5, Quanto você avalia o atendimento?")
                        .setPlaceholder("5")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(1)
                        .setRequired(true);
                    const feedbackP2 = new TextInputBuilder()
                        .setCustomId("feedbackp2")
                        .setLabel("Avalie a velocidade de entrega de 1 à 5")
                        .setPlaceholder("5")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(1)
                        .setRequired(true);
                    const feedbackP3 = new TextInputBuilder()
                        .setCustomId("feedbackp3")
                        .setLabel("O que você achou sobre a compra?")
                        .setPlaceholder("Perfeita, super confiável")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setRequired(false);
                    feedbackModal.addComponents(
                        new ActionRowBuilder().addComponents(feedbackP1),
                        new ActionRowBuilder().addComponents(feedbackP2),
                        new ActionRowBuilder().addComponents(feedbackP3)
                    )
                    interaction.showModal(feedbackModal);
                    break;
            default:
                break;
        }
    }
}


//////////////////////////////////////////



async function addTocart(interaction,userDb,product){
    const findedProduct =userDb.cart.products.find(productItem=>productItem.productName == product.productName);
    
    
    if(findedProduct != null){
        await model.guild.updateOne(
            {
              guildId: interaction.guild.id,
              'users.userId': interaction.user.id,
              'users.cart.products.productName': findedProduct.productName,
            },
            {
              $set: {
                'users.$[user].cart.products.$[product].productQuantity': findedProduct.productQuantity+1, // Nova quantidade do produto
                'users.$[user].cart.total': userDb.cart.total+product.productPrice // Novo total do carrinho do usuário (caso o preço esteja disponível em algum lugar)
              }
            },
            {
              arrayFilters: [
                { 'user.userId': interaction.user.id },
                { 'product.productName': findedProduct.productName }
              ]
            }
          );
          return false;
    }else if(findedProduct== null){
        if(userDb.cart.itens >= 3) 
        {
            interaction.reply({content:`Você já adicionou o número máximo de tipos de produtos no carrinho. Caso deseje continuar, remova algo do carrinho ou finalize a compra para adicionar esse produto.`,ephemeral:true});
            return true;
        }
    
        await model.guild.updateOne(
            {
              guildId: interaction.guild.id,
              'users.userId': interaction.user.id
            },
            {
              $push: {
                'users.$.cart.products': {
                  productName: product.productName,
                  productPrice: product.productPrice,
                  productQuantity: 1
                }
              },
              $set: {
                'users.$.cart.itens': userDb.cart.itens + 1,
                'users.$.cart.total': userDb.cart.total + product.productPrice // Substitua pelo novo valor total
              }
            }
          );
          return false; 
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
async function cancelMSG(interaction){
    try{
    const pathQRCode = `./pix/${interaction.user.username}qrcode.png`;
    const pathQRCodeWrited = `./pix/${interaction.user.username}qrcode.txt`;
    
    fs.unlink(pathQRCodeWrited,(error)=>{
        if(error){
            console.log("Houve um erro ao tentar apagar o arquivo");
        }
    })
    fs.unlink(pathQRCode, (error)=>{
        if(error){
            console.log("Houve um erro ao tentar apagar o arquivo");
        }
    })
    }catch{

    }
    const embed = new EmbedBuilder()
        .setAuthor({name:`${interaction.guild.name}`})
        .setTitle("| Sua compra foi cancelada")
        .setDescription("A sua compra foi cancelada")
        .setFooter({text:"Você é bem-vindo para comprar com a gente sempre <3"})
        .setColor("Red")
        .setTimestamp(new Date());
    interaction.user.send({content:`<@${interaction.user.id}>`,embeds:[embed]})
}