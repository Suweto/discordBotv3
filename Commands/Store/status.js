const {SlashCommandBuilder,PermissionFlagsBits} = require('discord.js');
const {guild} = require("../../Models/models.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Verifica o status da loja")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(command=>
            command
                .setName("open")
                .setDescription("Abre a loja"))
        .addSubcommand(command=>
            command
                .setName("close")
                .setDescription("fecha a loja")
                ),
async execute(interaction){
    const subCommand = interaction.options.getSubcommand();
    const guildDB = await guild.findOne({guildId:interaction.guild.id});
    switch (subCommand) {
        case "open":
            if(guildDB.status == true){
                interaction.reply({content:`A loja já estava aberta`,ephemeral:true});
                return
            }
            else if(guildDB.status == false){
                await guild.updateOne({guildId:interaction.guild.id},{$set:{status:true}});
                interaction.reply({content:`A foi aberta com sucesso`,ephemeral:true});
                return
            }
            break;
        case "close":
            if(guildDB.status == false){
                interaction.reply({content:`A loja já estava fechada`,ephemeral:true});
                return
            }
            else if(guildDB.status == true){
                await guild.updateOne({guildId:interaction.guild.id},{$set:{status:false}});
                interaction.reply({content:`A foi fechada com sucesso`,ephemeral:true});
                return
            }
            break;
        default:
            break;
    }
}
}