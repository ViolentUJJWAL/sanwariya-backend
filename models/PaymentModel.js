import mongoose from "mongoose";

const PaymentModel = new mongoose.Schema({
    paymentBy : {
        type: String,
        required: true,
    },
    paymentMethod: {
        enum: ['cash', 'card', 'UPI'],
        required: true,
    },
})