const {Client} = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config()
const {DBTOKEN} = process.env
module.exports = {
    name: "ready",
    once:true,
    async execute(client){
        await mongoose.connect(DBTOKEN || '')
        if(mongoose.connect){
            console.log("MongoDB conectou com sucesso");
        }
        console.log(`${client.user.tag} Está Online`);
    },
}