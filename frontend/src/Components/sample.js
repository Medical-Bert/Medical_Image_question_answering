import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './test.css';
import jsonData from '../data/total.json';
import myImage from '../data/image2664.jpg';
import myImage1 from '../data/image2665.jpg';
import myImage2 from '../data/image2666.jpg';


import axios from 'axios'



const Suggestion = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [model, setModel] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imgpath, setImgpath] = useState(null);
    const [value, setValue] = useState("");
    const textAreaRef = useRef(null);
    const [imgFile, setImgFile] = useState(null);
    const [modalContent, setModalContent] = useState([]);
    const [data, setData] = useState([]);
    const [storedUsername, setStoredUsername] = useState(null);

    const [storedQandA, setStoredQandA] = useState([]);





    const handleLogoutClick = () => {
        // Your existing logout logic
        localStorage.removeItem('jwt');
        localStorage.removeItem('loggeduser');
        navigate('/login');

        toast.success('Logout Successful', {
            position: 'bottom-right',
            autoClose: 1400,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
        });
    };




    useEffect(() => {
        setData(jsonData);
        setStoredUsername(localStorage.getItem('loggeduser'))
    }, []);


    const handleImageUpload = async (e) => {
        const file = e.target.files[0];

        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                setImgFile(file);

                setUploadedImage(URL.createObjectURL(file));
                setImgpath(file.name);

                console.log(data[0]);

                console.log(file.name);

                // Remove the file extension from the file name
                const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');

                const matchingRows = data.filter((row) => row.image === fileNameWithoutExtension);
                console.log(matchingRows);
                console.log(matchingRows.length);

                // Generate modal content or show a message
                const modalContent =
                    matchingRows.length > 0 ? (
                        <table className="table t">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Question</th>
                                    <th>Answer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchingRows.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.image}</td>
                                        <td>{row.question}</td>
                                        <td>{row.answer}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No suggestions available for this image.</p>
                    );

                setModalContent(modalContent);

                toast.success('Image uploaded successfully', {
                    position: 'bottom-right',
                    autoClose: 1400,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
            } catch (error) {
                console.error('Error uploading image:', error);

                toast.error('Failed to upload image', {
                    position: 'bottom-right',
                    autoClose: 1400,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });
            }
        }
    };




    const [qandaContent, setQandaContent] = useState([]);





    const getans = async () => {
        const question = value;
        console.log(value);
        const flaskurl = process.env.REACT_APP_flaskurl;

        const formData = new FormData();
        formData.append('question', question);
        formData.append('flaskurl', flaskurl);
        formData.append('file', imgFile);
        formData.append('model', model);
        console.log(imgFile.name);

        try {
            const response = await axios.post('http://localhost:5000/modeloutput', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            // Log the predicted value from the Flask app
            console.log('predicted value', response.data);

            // Assuming you want to store the predicted value in 'pAnswer'
            const pAnswer = response.data.prediction;

            // Continue with any additional logic using pAnswer
            console.log('Final method:', pAnswer);



            const modelNames = {
                "0": "( PRETRAINED VILT )",
                "1": "( BLIP MODEL )",
                "2": "( FUSION ONE WORD )",
                "3": "( FUSION DESCRIPTIVE)",
            };

            const newContent = [
                <>
                    <div key={question} style={{ backgroundColor: '#000000', padding: '8px' }}>
                        <strong style={{ color: '#18e74f' }}><span style={{ color: 'magenta' }}>{modelNames[model]}</span>   Question:</strong> {question}
                    </div>
                    <div className='my-2' style={{ backgroundColor: '#000000', padding: '8px', borderRadius: '8px' }}>
                        <div key={pAnswer} style={{ padding: '8px' }}>
                            <strong style={{ color: '#da591c' }}>Predicted:</strong> {pAnswer}
                        </div>
                    </div>
                    <br />
                </>
            ];

            const newQandA = {
                question: value,
                answer: response.data.prediction,
            };

            setStoredQandA((prevQandA) => [...prevQandA, newQandA]);

            setQandaContent((prevContent) => [...prevContent, ...newContent]);

            // Clear the input field
            setValue('');

            // You can also scroll the "qanda" div to the bottom to show the latest Q&A
            const qandaDiv = document.getElementById('qanda');
            qandaDiv.scrollTop = qandaDiv.scrollHeight;
        } catch (error) {
            console.log('sleep');
            // Log any errors that occurred during the request
            console.log('Error:', error.message);
        }
    };



    const mongosaver = async () => {
        try {
            if (!imgFile) {
                // Handle error as before
                return;
            }

            const imageName = imgFile.name.split('.').slice(0, -1).join('');
            const response = await axios.post('http://localhost:5000/storeInfo', {
                params: {
                    userName: localStorage.getItem('loggeduser'),
                    imageData: imageName,
                    qaPairs: storedQandA,
                },
                withCredentials: true,
            });

            toast.success('Data saved to Mongo successfully', {
                position: 'bottom-right',
                autoClose: 1400,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });

        } catch (error) {
            // Handle error as before
        }
    };



    const handleChange = (e) => {
        setValue(e.target.value);
    };
    const handleEnterPress = (e) => {
        if (e.key === 'Enter' && value.trim() !== '') {
            e.preventDefault();
            getans();
        }
        else if (e.key === "Enter" && e.shiftKey) {
            setValue((prevValue) => prevValue + '\n');
        }
    };


    const handleClearImage = () => {
        setQandaContent([]);
        setModalContent([]);
        setUploadedImage(null);
        setImgFile(null);
        setValue("");
        setStoredQandA([]);
    };

    const handleSubmit = (e) => {
        if (value.trim() !== '') {
            e.preventDefault();
            getans();
        }
        if (value.trim !== '' && model === '') {
            toast.success('Select The model', {
                position: 'bottom-right',
                autoClose: 1400,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        }
        else {
            toast.success('Enter the question in the field', {
                position: 'bottom-right',
                autoClose: 1400,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            });
        }
    };

    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    // Function to handle image button click
    const handleImageButtonClick = (index) => {
        setSelectedImageIndex(index);
    };

    const handleUploadImageLink = async (imageLink) => {
        try {
            const response = await fetch(imageLink);
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }
    
            const blob = await response.blob();
            const reader = new FileReader();
    
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                console.log('Base64 Data:', base64Data); // Log the base64 data to the console
    
                const file = new File([blob], 'image_from_link.jpg', { type: 'image/jpeg' });
                setImgFile(file);
                setUploadedImage(`data:image/jpeg;base64, ${base64Data}`);
            };
    
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error fetching or converting image:', error);
        }
    };
    

    const [testimages, setTestimages] = useState(null);

    useEffect(() => {
        const getimgfiles = (
            <div>
                <div >
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>

                </div>
                <br />
                <div >
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>
                    <button className='mx-2'>
                        <img src="https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" alt="image1" className='mx-3 my-3 ' style={{ width: '120px', height: '150px' }} />
                    </button>



                </div>
                <br />
            </div>
        );

        setTestimages(getimgfiles);
    }, []);

    return (
        <div className="container-fluid">
            <div className="modal fade" id="example" aria-labelledby="exampleModalLabel">
                <div className="modal-dialog  modal-dialog-scrollable modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">
                                Sample questions
                            </h1>
                            <p className='mx-5 my-3' > ****note that the sample images will only be displayed for test images of our dataset</p>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body d-flex justify-content-center">
                            {modalContent}
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="example1" aria-labelledby="exampleModalLabel">
                <div className="modal-dialog  modal-dialog-scrollable modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">
                                Sample refference images
                            </h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body d-flex justify-content-center">
                            {testimages}
                        </div>
                        <button className='btn btn-primary btn-lg' onClick={() => handleUploadImageLink("https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350")}>
                            uploadimagelink
                        </button>
                    </div>
                </div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={800}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="row">
                <div className="previous_chat col-2 d-flex flex-column align-items-start mb-3">
                    <div>
                        <br />
                        <strong>Medical Image </strong>
                        <p>Visual Question Answering</p>
                    </div>
                    <div className="mb-auto p-2">
                        <button className="btn btn-secondary my-3 mx-2" style={{ display: 'flex', alignItems: 'center' }} data-bs-toggle="modal" data-bs-target="#example1">
                            <p>Choose sample images</p>
                        </button>
                        <p>..........Previously Saved .........</p>
                        <hr />

                    </div>
                    <div className="my-5 mx-3">
                        <div className='d-flex text-inline'>
                            <h4>Welcome </h4>
                            <h4 className='mx-2'>{storedUsername}</h4>
                        </div>
                        <div>
                            <button className="btn btn-secondary" onClick={handleLogoutClick}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
                <div className="current_chat col-10 mb-3">
                    <div className="row">
                        <div className="col-6">
                            <br />
                            <br />

                            {!uploadedImage && (
                                <div className='dottedborder'>
                                    <input type="file" id="userimage" onChange={handleImageUpload} />
                                    <p>upload here</p>
                                </div>
                            )}
                            {uploadedImage && (
                                <div>
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded Image"
                                        className="hieght-and-width mx-2"
                                    />
                                    <button className="btn btn-info btn my-2 mx-3" data-bs-toggle="modal" data-bs-target="#example">
                                        Sample questions
                                    </button>
                                    <button className='btn btn-primary my-2 mx-2' onClick={mongosaver}>save to mongo</button>
                                    <button className='btn btn-danger my-2 mx-2' onClick={handleClearImage}>clear</button>
                                </div>
                            )}
                        </div>
                        {uploadedImage && (
                            <>
                                <div className="col-6 scrollable-div my-3 bordered-primary" id="qanda">
                                    <div className='col-5'>
                                        <select id="dropdown" className='form-control' onChange={(e) => { setModel(e.target.value) }}>
                                            <option value="N/A">Choose model</option>
                                            <option value="0">Pretrained VILT</option>
                                            <option value="1">Blip Model</option>
                                            <option value="2">FUSION(one word)</option>
                                            <option value="3">fusion(desc)</option>
                                        </select>
                                    </div>
                                    {model}
                                    {qandaContent}
                                </div>
                            </>
                        )}
                    </div>
                    {uploadedImage && (
                        <div className='p-3'>
                            <form onSubmit={handleSubmit}>
                                <div className='d-flex text-inline'>
                                    <textarea
                                        onChange={handleChange}
                                        onKeyDown={handleEnterPress}
                                        placeholder="Ask any question related to the image:"
                                        ref={textAreaRef}
                                        rows={4}
                                        value={value}
                                        style={{ maxHeight: '150px', overflowY: 'auto' }}
                                    />
                                    <button type='submit' className='btn btn-primary mx-2 btn-lg'>
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
};

export default Suggestion;