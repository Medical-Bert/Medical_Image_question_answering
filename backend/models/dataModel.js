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
});

const datasaverSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
    },
    userName: {
        type: String,
        required: true,
    },
    data: [{
        images: [{
            image: {
                type: String, // Store image as base64
                required: true,
            },
            qaPairs: [{
                type: questionAnswerSchema,
                required: true,
            }],
        }],
    }],
}, { versionKey: false });

const DatasaverModel = mongoose.model('datasaver', datasaverSchema);

module.exports = DatasaverModel;
