const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder,ButtonBuilder,ActionRowBuilder, ButtonStyle} = require('discord.js');
const model = require('../../Models/models.js');
const fs = require('fs');
module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Fecha algum ticket aberto de alguém")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addStringOption(option=>
        option
            .setName("optionticket")
            .setChoices({name:`support`,value:`support`},{name:`buy`,value:`buy`})
            .setRequired(true)
            .setDescription("Qual ticket vai ser fechado")
    )
    .addUserOption(option=>
        option
            .setName("user")
            .setDescription("alvo")
            .setRequired(true)
            )
            ,
    
    async execute(interaction){
        const option = interaction.options.getString('optionticket');
        const user = interaction.options.getUser('user');
        const guildDB = await model.guild.findOne({guildId:interaction.guild.id});
        const userDb = guildDB.users.find(userID=>userID.userId === user.id);
        if(user == null){
            interaction.reply({content:`Usuario não existe no banco de dados`,ephemeral:true})
            return;
        }
        switch (option) {
            case "support":
                if(userDb == null){
                    interaction.reply({content:`Esse usuario não está no banco de dados`,ephemeral:true});
                    return;
                }
                if(userDb.support.isOpen == true){
                    const channel =userDb.support.channel;
                    const channelid =interaction.guild.channels.cache.get(channel);
                    await model.guild.updateOne({guildId:interaction.guild.id,"users.userId":userDb.id},{$set:{"users.$.support.isOpen":false,"users.$.support.channel":null}})
                    channelid.delete();
                    interaction.reply({content:`O ticket de support do usuario ${user.username} foi fechado com sucesso`,ephemeral:true});
                    return;
                }else if(userDb.support.isOpen == false){
                    interaction.reply({content:"O support desse usuario está fechado",ephemeral:true});
                    return;
                }
                break;
            case "buy":
                if(userDb == null){
                    interaction.reply({content:`Esse usuario não está no banco de dados`,ephemeral:true});
                    return;
                }
                if(userDb.cart.isBuying == true){
                    const channel = userDb.cart.channel;
                    const channelid = interaction.guild.channels.cache.get(channel);
                    await channelid.delete();
                    await model.guild.updateOne(
                        {guildId:interaction.guild.id,"users.userId":user.id},
                        {$set:
                            {"users.$.cart":
                                
                                    {
                                        
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
                                }
                            }
                        })
                        const pathQRCode = `./pix/${user.username}qrcode.png`;
                        const pathQRCodeWrited = `./pix/${user.username}qrcode.txt`;
                        try {
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
                        } catch (error) {
                            
                        }
                        interaction.reply({content:`O ticket de compra foi fechado com sucesso`,ephemeral:true});
                }else if(userDb.cart.isBuying == false){
                    interaction.reply({content:`Esse usuario nao está em compra`,ephemeral:true});
                }
                break;
            default:
                break;
        }
        
    }
}