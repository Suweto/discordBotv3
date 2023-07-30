const {EmbedBuilder,Embed,GuildMember} = require('discord.js');
const model = require('../../Models/models.js')

module.exports = {
    name: "guildMemberAdd",
    async execute(member){
        const data = await model.guild.findOne({guildId:member.guild.id})
            if(!data) return;

            const {user,guild} = member;
            const welcomeChannel = member.guild.channels.cache.get(data.welcome.welcomeChannel);

            const welcomeEmbed = new EmbedBuilder()
                .setTitle("Novo Membro")
                .setDescription(`<@${user.id}>, Seja bem-vindo ao servidor`)
                .setColor("Random")
                .setThumbnail(user.avatarURL())
                .addFields([{name: "Total de membros",value:`${guild.memberCount}`}])
                .setTimestamp(new Date())
        
        welcomeChannel.send({embeds:[welcomeEmbed]});
        member.roles.add(data.welcome.welcomeRole);
    }
}