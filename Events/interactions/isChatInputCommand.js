const {CommandInteraction} = require('discord.js');

module.exports = {
    name:"interactionCreate",

    execute(interaction,client){
        if(!interaction.isChatInputCommand) return;
        if(interaction.isChatInputCommand()) 
        {
            const command = client.commands.get(interaction.commandName);

            if(!command)
            {
                interaction.reply({content:"Comando não encontrado"});
            }

            command.execute(interaction,client);
    }   }
}