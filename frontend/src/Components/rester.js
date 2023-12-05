import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './test.css';



import axios from 'axios'



const Tester = () => {
    const navigate = useNavigate();
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const [uploadedImage, setUploadedImage] = useState(null);
    const [imgpath, setImgpath] = useState(null);
    const [value, setValue] = useState("");
    const textAreaRef = useRef(null);
    

    const [imgFile, setImgFile] = useState(null); 




    const handleLogoutClick = () => {
        // Your existing logout logic
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            const cookieName = cookie.split('=')[0];
            document.cookie = `${cookieName}=; Max-Age=-1; path=/;`;
        }

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



    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
    
        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                setImgFile(file)
    
                setUploadedImage(URL.createObjectURL(file));
                setImgpath(file.name);
    
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
        // formData.append('flaskurl', flaskurl);
        formData.append('file', imgFile);
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
    
            const newContent = [
                <>
                    <div key={question} style={{ backgroundColor: '#000000', padding: '8px' }}>
                        <strong style={{ color: '#18e74f' }}>Question:</strong> {question}
                    </div>
                    <div className='my-2' style={{ backgroundColor: '#000000', padding: '8px', borderRadius: '8px' }}>
                        <div key={pAnswer} style={{ padding: '8px' }}>
                            <strong style={{ color: '#da591c' }}>Predicted:</strong> {pAnswer}
                        </div>
                    </div>
                    <br />
                </>
            ];
    
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
    

    const handleChange = (e) => {
        setValue(e.target.value);
    };



    return (
        <div className="container-fluid">
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
                        <button className='btn btn-secondary'>new chat</button>
                    </div>
                    <div className="my-5 mx-3">
                        <div>
                            <h4>Welcome user</h4>
                        </div>
                        <br />
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
                                    {uploadedImage}
                                </div>
                            )}
                            {uploadedImage && (
                                <div>
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded Image"
                                        className="hieght-and-width mx-2"
                                    />
                                    <p>{uploadedImage}</p>

                                    <button className='btn btn-warning my-2 mx-3'>new</button>
                                </div>
                            )}
                        </div>
                        <div className="col-6 scrollable-div my-3 bordered-primary" id="qanda">
                            {qandaContent}
                        </div>
                    </div>

                    <div className='p-3'>
                        <div className=' d-flex text-inline'>
                            <textarea
                                onChange={handleChange}
                                placeholder="Ask any question related to the image:"
                                ref={textAreaRef}
                                rows={4}
                                value={value}
                                style={{ maxHeight: '150px', overflowY: 'auto' }}
                            />
                            <button className='btn btn-primary mx-2 btn-lg' onClick={() => { getans() }}>submit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tester;