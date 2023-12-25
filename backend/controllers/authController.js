const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const nodemailer = require('nodemailer');
const DatasaverModel = require('../models/dataModel');


const FormData = require('form-data');

const axios = require('axios');

const maxAge = 3 * 24 * 60 * 60 * 1000;

var otp1 = 1;

const multer = require('multer');
const { application } = require('express');



const storeInfo = async (req, res) => {
    try {
        const { userName, imageData, qaPairs } = req.body.params;
        
        console.log(req.query)
        console.log(req.body)
        console.log(req.body.params)

        if (!userName || !imageData || !qaPairs) {
            // Check if required fields are missing
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Find the user by userName
        let user = await DatasaverModel.findOne({ userName: userName });

        if (!user) {
            // If the user does not exist, create a new entry for the user
            user = new DatasaverModel({
                userName: userName,
                data: [{
                    image: imageData,
                    qaPairs: qaPairs,
                }],
            });

            const result = await user.save();
            console.log('Saved datasaver item:', result);

            res.status(200).json({ success: true, message: 'Data saved successfully' });
        } else {
            // Find the existing datasaver item for the user and image
            const existingDataSaver = await DatasaverModel.findOne({
                _id: user._id,
                'data.image': imageData, // Check for the image in the 'data' array
            });

            if (existingDataSaver) {
                // Image exists, append the new question and answers
                const existingImage = existingDataSaver.data.find(item => item.image === imageData);
                existingImage.qaPairs.push(...qaPairs);

                const result = await existingDataSaver.save();
                console.log('Appended datasaver item:', result);

                res.status(200).json({ success: true, message: 'Data appended successfully' });
            } else {
                // Image does not exist, create a new entry for the image
                user.data.push({
                    image: imageData,
                    qaPairs: qaPairs,
                });

                const result = await user.save();
                console.log('Saved datasaver item:', result);

                res.status(200).json({ success: true, message: 'Data saved successfully' });
            }
        }
    } catch (error) {
        console.error('Error storing data:', error);
        res.status(500).json({ success: false, message: 'Failed to store data' });
    }
};





var storage = multer.diskStorage({
    destination: "./uploads",
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Save file with its original name
    }
});

var upload = multer({ storage: storage }).array('file');


const imgupload = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }

        // Assuming you want to send the file details in the response
        const fileDetails = req.files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            path: file.path
        }));

        res.status(200).json({ files: fileDetails });
    });
};



const generateToken = (user) => {
    return jwt.sign({ username: user.username }, 'secret_key is blash');
};

const getotp = async (req, res) => {
    res.json({ otp: otp1 });
};

const genotp = async (req, res) => {
    const { userId, email } = req.body;

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("user id is", userId)

    console.log("email id  is", email)
    console.log("otp  is")
    console.log(otp)
    otp1 = otp
    console.log("pathetic")
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            // TODO: replace `user` and `pass` values from <https://forwardemail.net>
            user: process.env.REACT_APP_email,
            pass: process.env.REACT_APP_password,
        },
    });

    console.log("pathetic fool")

    const mailOptions = {
        from: process.env.REACT_APP_email,
        to: userId,
        subject: 'OTP Verification from our medical vqa team',
        text: `Your OTP for verification is: ${otp}`,
    };
    console.log("pathetic")

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

// const genotp = async (req, res) => {
//     const { userId, email } = req.body;

//     // Generate a random 6-digit OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     console.log("user id is", userId)

//     console.log("email id  is", email)
//     console.log("otp  is")
//     console.log(otp)
//     otp1 = otp
//     console.log("pathetic")
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         host: "smtp.gmail.com",
//         port: 587,
//         secure: false,
//         auth: {
//             // TODO: replace `user` and `pass` values from <https://forwardemail.net>
//             user: process.env.REACT_APP_email,
//             pass: process.env.REACT_APP_password,
//         },
//     });

//     console.log("pathetic fool")

//     const mailOptions = {
//         from: process.env.REACT_APP_email,
//         to: userId,
//         subject: 'OTP Verification from our medical vqa team',
//         text: `Your OTP for verification is: ${otp}`,
//     };
//     console.log("pathetic")

//     try {
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent: ' + info.response);
//         res.json({ success: true, message: 'OTP sent successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Failed to send OTP' });
//     }
// };

const signup = async (req, res) => {
    try {
        const newItem1 = new UserModel({
            username: req.body.uname,
            email: req.body.mail,
            password: req.body.key,
        });
        const result = await newItem1.save();
        console.log('Saved item:', result);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

const login = async (req, res) => {
    console.log('Received login request:', req.query);
    const { identifier, password } = req.query;

    try {
        const user = await UserModel.findOne({
            $or: [
                { username: identifier },
                { email: identifier },
            ],
        });

        if (user) {
            bcrypt.compare(password, user.password, function (err, result) {
                if (result === true) {
                    const token = generateToken(user);

                    res.cookie("jwt", token, {
                        withCredentials: true,
                        httpOnly: false,
                        maxAge: maxAge,
                    });
                    res.json({ status: 'success', token, created: true, user: user.username });
                } else {
                    console.log("wrong pasword........")
                    res.status(401).json({ error: 'IncorrectPassword', message: 'Incorrect password' });
                }
            });
        } else {
            console.log("wrong user........")
            res.status(401).json({ error: 'UserNotFound', message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

const getProfile = (req, res) => {
    const token = req.cookies.jwt;
    console.log(token)
    if (token) {
        try {
            const decoded = jwt.verify(token, 'secret_key is blash');
            const { username } = decoded;
            res.json({ username });
        } catch (err) {
            res.sendStatus(401); // Invalid token
        }
    } else {
        res.sendStatus(401); // No token found
    }
};





const fs = require('fs').promises; // Using fs.promises for asynchronous file operations

// const modeloutput = async (req, res) => {
//     console.log(req.body);

//     const question = req.body.question;
//     const flaskurl = req.body.flaskurl;
//     console.log(flaskurl)
//     const file = req.files.file;
//     console.log(question);
//     console.log(file);
//     const link='http://'+flaskurl+'/predict';
//     console.log(link)
//     try {
//         // Read the file asynchronously as a Buffer
//         const dataBuffer = await fs.readFile(file.path);

//         // Convert the image data to base64
//         const imageData = dataBuffer.toString('base64');

//         // Prepare input data for the POST request
//         const input_data = {
//             question: question,
//             data: imageData,
//             name: file.originalFilename,
//         };

//         // Assuming axios is properly imported in your actual code
//         const response = await axios.post(link, input_data, {
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         console.log('Predicted value:', response.data.prediction);

//         // Send the prediction as JSON in the HTTP response
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error:', error.message);

//         // Send a 500 Internal Server Error response with the error message
//         res.status(500).json({ error: error.message });
//     }
// };


const modeloutput1 = async (req, res) => {
    console.log(req.body);
    try {
        const num = req.body.number;
        const operator = req.body.operation;  // Fix: Change 'operator' to 'op'

        // Prepare input data for the POST request
        const input_data = {
            number: num,
        };

        // Concatenate the new port number to the axios post URL
        const response = await axios.post(`http://16.171.8.45/${operator}/calculate`, input_data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Predicted value:', response.data);

        // Send the prediction as JSON in the HTTP response
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);

        // Send a 500 Internal Server Error response with the error message
        res.status(500).json({ error: error.message });
    }
};



const modeloutput= async (req, res) => {
    console.log(req.body);

    const question = req.body.question;
    const model = req.body.model;
    const file = req.files.file;
    console.log(question);
    console.log(file);

    try {
        // Read the file asynchronously as a Buffer
        const dataBuffer = await fs.readFile(file.path);

        // Convert the image data to base64
        const imageData = dataBuffer.toString('base64');

        // Prepare input data for the POST request
        const input_data = {
            question: question,
            data: imageData,
            name: file.originalFilename,
        };

        // Convert the model value to a number and add it to 8000
        const modelNumber = parseInt(model, 10);
        const newPortNumber = modelNumber;

        // Concatenate the new port number to the axios post URL
        const response = await axios.post(`http://127.0.0.1:8000/predict${newPortNumber}`, input_data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // const response = await axios.post(`http://127.0.0.1:${newPortNumber}/predict`, input_data, {
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        // });

        console.log('Predicted value:', response.data.prediction);

        // Send the prediction as JSON in the HTTP response
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);

        // Send a 500 Internal Server Error response with the error message
        res.status(500).json({ error: error.message });
    }
};



module.exports = {
    genotp,
    signup,
    login,
    getProfile,
    getotp,
    modeloutput,
    modeloutput1,
    imgupload,
    storeInfo
};
