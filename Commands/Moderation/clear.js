const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder,ButtonBuilder,ActionRowBuilder, ButtonStyle} = require('discord.js');

module.exports = 
{
    data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpa uma quantidade especifica de mensagens")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option=>
        option
            .setName('value')
            .setDescription('quantidade de mensagens que irão ser apagadas')
            .setRequired(true)
            ),
    
    async execute(interaction){
        const {channel,options} = interaction;

        const amount = options.getInteger('value');
        await channel.bulkDelete(amount);

        const button = new ButtonBuilder()
            .setLabel("Teste")
            .setStyle(ButtonStyle.Primary)
            .setCustomId('teste');
        const row = new ActionRowBuilder().addComponents(button)

        interaction.reply({content:`${amount} mensagens foram apagadas com sucesso`,ephemeral:true,components:[row]});
        
    }
}