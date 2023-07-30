const {CommandInteraction,ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const model = require('../../Models/models.js');
module.exports = 
{
    name:"interactionCreate",

    async execute(interaction,client){
        if(!interaction.isButton()) return;
        if(interaction.customId.startsWith('store')) return;
        const {customId} = interaction;
        const guildId = interaction.guild.id;
        switch (customId) {
            case 'support':
                let userFind = await model.guild.findOne({guildId,'users.userId':interaction.user.id});
                if(!userFind){
                    userFind = await model.guild.findOneAndUpdate(
                        {guildId:guildId},
                        {$push:
                            {'users':
                                {
                                    userId: interaction.user.id,
                                    balance: 0,
                                    support:
                                    {
                                    isOpen: false,
                                    }
                                }
                            }  
                        },
                        {new:true});
                }
                const user = userFind.users.find(user => user.userId === interaction.user.id);
                if(user.support.isOpen == true){
                    interaction.reply({content:`Você já possui Support aberto <#${user.support.channel}>`,ephemeral:true})
                    return;
                }else if(user.support.isOpen == false){
                    await model.guild.updateOne({guildId,'users.userId':interaction.user.id},{$set:{'users.$.support.isOpen':true}})
                }
                const channel = await interaction.guild.channels.create({
                    name: `support-${interaction.user.username}`,
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
                });
                await model.guild.updateOne({guildId,'users.userId':interaction.user.id},{$set:{'users.$.support.channel':channel.id}});
                const embed = new EmbedBuilder()
                    .setTitle(`| Área de Support`)
                    .setDescription(`<@${interaction.user.id}>, Bem-vindo a área de support\ncomo podemos te ajudar?`)
                    .setColor('Random')
                    .setTimestamp(new Date())
                    .setAuthor({name:interaction.guild.name})
                const closeTicket = new ButtonBuilder()
                    .setCustomId('closeticket')
                    .setLabel('Fechar o ticket')
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(closeTicket)
                await channel.send({content:`<@${interaction.user.id}>`,embeds:[embed],components:[row]});
                await interaction.reply({content:`O seu chat de Support foi criado <#${channel.id}>`,ephemeral:true});
                    break;
                case 'closeticket':
                    const supportUser = await model.guild.findOne({guildId,'users.userId':interaction.user.id});
                    const supportUser2 = supportUser.users.find(user => user.userId === interaction.user.id);
                    await model.guild.updateOne({guildId,'users.userId':interaction.user.id},{$set:{'users.$.support.isOpen':false,'users.$.support.channel':null}})

                    const supportChannel = client.channels.cache.get(supportUser2.support.channel);
                    supportChannel.delete()
                    
                    
                        break;
            default:
                break;
        }

    }
}