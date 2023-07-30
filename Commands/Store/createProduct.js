const {SlashCommandBuilder,CommandInteraction,PermissionFlagsBits, EmbedBuilder} = require('discord.js');
const model = require('../../Models/models.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName("create-product")
    .setDescription("Cria um produto no banco de dados/Ve os produtos já criados")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption(option=>
        option
            .setName('productname')
            .setDescription('Nome Do produto')
            .setRequired(false))
    .addNumberOption(option=>
        option
            .setName('price')
            .setDescription("preço do produto")
            .setRequired(false)),
    async execute(interaction){
        const productName = interaction.options.getString('productname')?.toLowerCase();
        const productPrice = interaction.options.getNumber('price');

        if(productName){

            if(!productPrice){
                interaction.reply({content:`Para criar um produto você precisa colocar um preço nele`,ephemeral:true});
                return;
            }  

            if(await verifyName(interaction.guild.id,productName)){
                interaction.reply({content:`Erro, Você colocou um nome já existe no banco de dados\nTente novamente com outro nome`,ephemeral:true})
                return;
            }
            await model.guild.updateOne(
                {guildId:interaction.guild.id},
                {$push:{products:{productName:productName,productPrice:productPrice}}}
            )
            await interaction.reply({content:`O produto "${productName}" com o preço de "${productPrice}", foi adicionado com sucesso`,ephemeral:true})
            return
        }else if(productPrice){
            interaction.reply({content:`Para criar um produto você precisa colocar o nome dele`,ephemeral:true});
            return;
        }
        const products = await model.guild.findOne({guildId:interaction.guild.id});
        let a = [];
        for(const product of products.products){
            a.push({name:product.productName,value:`R$ ${product.productPrice}`,inline:true})
        } 
        const embed = new EmbedBuilder()
            .setTitle("| Produtos")
            .setColor("Random")
            .setAuthor({name:`${interaction.client.user.username}`})
            .setDescription(`Produtos do servidor: ${interaction.guild.name}`)
            .addFields(a)
        
        interaction.reply({embeds:[embed]});
    }
}

async function verifyName(guildId, productName){
    try{
        const productFinded = await model.guild.findOne({guildId,'products.productName':productName});
        if(productFinded){
            return true;
        }else{
            return false;
        }
    }catch(e){
        console.error("Deu erro",e);
    }
}