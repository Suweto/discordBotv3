const mongoose = require('mongoose');

const guildScheme = new mongoose.Schema(
{
    guildId: String,
    clienteRole: String,
    feedbackChannel:String,
    proofChannel:String,
    welcome:
    {
        welcomeChannel: String,
        welcomeRole: String,
    },
    cupom:
    [
        {
            cupomName: String,
            cupomPorcentage: Number,
        }
    ],
    products:
    [
        {
            productName: String,
            productPrice: Number,
        }
    ],
    users:
    [
        {
            userId: String,
            balance: Number,
            support:
            {
                isOpen: Boolean,
                channel: String,
            },
            cart: 
            {
                isBuying: Boolean,
                isFinal: Boolean,
                channel: String,
                msg: String,
                cupom: 
                {
                    cupomName:String,
                    cupomPorcentage:Number,
                },
                total: Number,
                total2: Number,
                products:
                [
                    {
                        productName: String,
                        productPrice: Number,
                        productQuantity: Number,
                    }
                ]
            }
        }
    ]
})

module.exports = mongoose.model('Guild',guildScheme);