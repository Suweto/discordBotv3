const {SlashCommandBuilder,CommandInteraction,PermissionFlagsBits, EmbedBuilder} = require('discord.js');
const {guild} = require("../../Models/models.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("saldo")
    .setDescription("Mostra o saldo da sua conta")
    ,
    async execute(interaction){
        let dataGuild = await guild.findOne({guildId:interaction.guild.id});
        if(!dataGuild) return interaction.reply({content:`Esse servidore não foi ativado, Peça para algum Moderador ativar-lo`,ephemeral:true})
        let dataUser = dataGuild.users.find(user=>user.userId == interaction.user.id);
        if (dataUser == null){
            dataGuild = await model.guild.findOneAndUpdate(
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
                dataUser = dataGuild.users.find(user=>user.userId == interaction.user.id);
        }
        const embedSaldo = new EmbedBuilder()
            .setAuthor({name:`${interaction.guild.name}`})
            .setColor("Random")
            .setThumbnail(interaction.user.avatarURL())
            .setDescription(`<@${interaction.user.id}>`)
            .setFields(
                [
                    {
                        name:`Saldo`,
                        value:`R$ ||${dataUser.balance}||`,
                        inline:true,
                    }
                ]
            )
            .setFooter({text:`Os servidos não compartilham saldo`})
        interaction.reply({embeds:[embedSaldo],ephemeral:true});
    }
}