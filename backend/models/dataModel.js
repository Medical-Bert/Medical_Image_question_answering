const mongoose = require('mongoose');

const questionAnswerSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
}, { versionKey: false });

const datasaverSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    data: [{
        image: {
            type: String, // Store image as base64
            required: true,
        },
        qaPairs: [questionAnswerSchema], // Use the questionAnswerSchema here
    }],
}, { versionKey: false });

const DatasaverModel = mongoose.model('datasaver', datasaverSchema);


module.exports = DatasaverModel;
