const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder} = require('discord.js');
const model = require('../../Models/models');
module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Faz as configs basicas do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option=>
        option
            .setName("option")
            .setChoices(
                {
                    name:`welcome-chat`,
                    value:`welcomechat`
                        
                },
                {
                    name:"autorole",
                    value:"autorole"
                },
                {
                    name:"clienterole",
                    value:"clienterole"
                },
                {
                    name:`proofchannel`,
                    value:`proofchannel`
                },
                {
                    name:`feedbackchannel`,
                    value:`feedbackchannel`
                }
                
            )
            .setRequired(false)
            .setDescription("Opções para alterar"))
    .addChannelOption(option=>
        option
            .setName("channel")
            .setDescription("Canal que será designado para tal função")
            .setRequired(false))
    .addRoleOption(option=>
        option
            .setName('role')
            .setDescription('Cargo que será designado para tal função ')
            .setRequired(false)),
    
    async execute(interaction){

        let data = await model.guild.findOne({guildId:interaction.guild.id})
        if(!data){
            data = await model.guild.create(
                {
                    guildId:interaction.guild.id,
                }
            )
        }

        const option = interaction.options.getString('option');
        
        if(option)
        {
            switch(option){
                case 'welcomechat':
                    const channel = interaction.options.getChannel('channel');
                    data = await model.guild.findOneAndUpdate({guildId:interaction.guild.id},{$set:{'welcome.welcomeChannel':channel.id}},{new:true}); 
                break;
                case 'autorole':
                    const autorole = interaction.options.getRole('role');
                    data = await model.guild.findOneAndUpdate({guildId:interaction.guild.id},{$set:{'welcome.welcomeRole':autorole.id}},{new:true});
                    
                break;
                case 'clienterole':
                    const clienterole = interaction.options.getRole('role');
                    data = await model.guild.findOneAndUpdate({guildId:interaction.guild.id},{$set:{clienteRole:clienterole.id}},{new:true});
                break;
                case 'proofchannel':
                    const proofChannel = interaction.options.getChannel('channel');
                    data = await model.guild.findOneAndUpdate({guildId:interaction.guild.id},{$set:{proofChannel:proofChannel.id}},{new:true});
                    break;
                case 'feedbackchannel':
                    const feedbackChannel = interaction.options.getChannel('channel');
                    data = await model.guild.findOneAndUpdate({guildId:interaction.guild.id},{$set:{feedbackChannel:feedbackChannel.id}},{new:true});
                    break;
                default:
                    interaction.reply({content:'Você selecionou a opção errada',ephemeral:true});
                    return;
                    
                    break;
            }
        }
        

        const embed = new EmbedBuilder()
            .setAuthor({name:`${interaction.client.user.username}`})
            .setTitle(`${interaction.guild.name}`)
            .setDescription("Configurações do servidor")
            .setColor('Random')
            .addFields(
                [
                    {
                        name:"Chat de bem-vindo",
                        value:`<#${data.welcome.welcomeChannel || "não setado"}>`,
                        inline:true,
                    },
                    {
                        name:`Cargo Automatico`,
                        value:`<@&${data.welcome.welcomeRole || "não setado"}>`,
                        inline:true
                    },
                    {
                        name:`Cargo de Cliente`,
                        value:`<@&${data.clienteRole || "não setado"}>`,
                        inline:true
                    },
                    {
                        name:`Chat de FeedBack`,
                        value:`<#${data.feedbackChannel || "não setado"}>`,
                        inline:true
                    },
                    {
                        name:`Chat de comprovantes`,
                        value:`<#${data.proofChannel || "não setado"}>`,
                        inline:true
                    }
                ]
            )
        interaction.reply({embeds:[embed]});
    }
}