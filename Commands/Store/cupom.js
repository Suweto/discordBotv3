const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder,ButtonBuilder,ActionRowBuilder, ButtonStyle} = require('discord.js');
const model = require('../../Models/models.js')
module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("cupom")
    .setDescription("Adiciona um cupom no banco de dados")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option=>
        option
            .setName('optioncupom')
            .setDescription("Selecione a opção")
            .setChoices({name:`add`,value:`add`},{name:`remove`,value:`remove`})
            .setRequired(false))
    .addStringOption(option=>
        option
            .setName('cupomname')
            .setMinLength(1)
            .setMaxLength(15)
            .setDescription("Nome do cupom")
            .setRequired(false)
            )
    .addIntegerOption(option=>
        option
            .setName('cupomporcentage')
            .setDescription('Porcentagem de desconto')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(30)
            ),
    
    async execute(interaction){
        let guildDB = await model.guild.findOne({guildId:interaction.guild.id});
        const cupomOption = interaction.options.getString("optioncupom");
        const cupomName = interaction.options.getString("cupomname");
        const cupomPorcentage = interaction.options.getInteger("cupomporcentage");
        let cupomDB = guildDB.cupom.find(cupom=>cupom.cupomName == cupomName);

        switch (cupomOption) {
            case "add":
                if(cupomDB != null){
                    interaction.reply({content:`O cupom ${cupomName} que você tentou adicionar já existe, tente com outro nome`,ephemeral:true})
                    return;
                }else if(cupomDB == null){
                    if(cupomPorcentage == null){
                        interaction.reply({content:`Você não colocou a porcentagem, tente novamente`,ephemeral:true});
                        return
                    }else if(cupomPorcentage <= 30)
                    {
                        guildDB = await model.guild.findOneAndUpdate(
                        {guildId:interaction.guild.id},
                        {$push:{cupom:{cupomName:cupomName,cupomPorcentage:cupomPorcentage}}},
                        {new:true}
                        );
                    }else if(cupomPorcentage >= 31){
                        interaction.reply({content:`A porcentagem "${cupomPorcentage}"% de desconto é muito alto o maximo é 30%`,ephemeral:true});
                        return;
                    }
                }
                break;
            case "remove":

                if(cupomDB == null){
                    interaction.reply({content:`O cupom ${cupomName} que você tentou remover não existe, tente novamente`,ephemeral:true});
                   
                    return;
                }else if(cupomDB != null){
                    guildDB = await model.guild.findOneAndUpdate(
                        { guildId: interaction.guild.id, 'cupom.cupomName': cupomName },
                        { $pull: { cupom: { cupomName: cupomName } } },
                        { new: true }
                      );
                    
                }
                

                break;
        
            default:
                
                break;
        }

        
        let list = [];
        for(const item of guildDB.cupom){
            list.push({name:`${item.cupomName}`,value:`**${item.cupomPorcentage}%** de desconto`,inline:true});
        }
        const embed = new EmbedBuilder()
            .setTitle(`| Cupons`)
            .setAuthor({name:`${interaction.guild.name}`})
            .setColor("Random")
            .setDescription(`Cupons do servidor ${interaction.guild.name}`)
            .setFields(list);

        interaction.reply({embeds:[embed]})

    
    }
}