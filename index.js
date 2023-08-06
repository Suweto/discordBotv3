const {Client, GatewayIntentBits,Partials,Collection} = require('discord.js');

const {Guilds,GuildMembers, GuildMessages } = GatewayIntentBits;
const {User, Message, GuildMember, ThreadMember, Channel} = Partials;

const {loadEvents} = require('./Handlers/eventHandler.js')
const {loadCommands} = require('./Handlers/commandHandler.js')

const dotenv = require('dotenv');
dotenv.config();
const {TOKEN} = process.env;

const client = new Client({intents:[Guilds,GuildMembers,GuildMessages],Partials:[User,Message,GuildMember,ThreadMember]});

client.commands = new Collection();



client.login(TOKEN).then(()=>{
    loadEvents(client);
    loadCommands(client);
});


