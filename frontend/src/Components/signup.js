import React, { useState ,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const SignUp = () => {
    
    const navigate = useNavigate();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    // Local storage keys for storing form values
    const LOCAL_STORAGE_KEYS = {
        USERNAME: 'username',
        EMAIL: 'email',
        PASSWORD: 'password',
        ROLE:'role',
    };

    useEffect(() => {
        
        const storedUsername = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);
        const storedEmail = localStorage.getItem(LOCAL_STORAGE_KEYS.EMAIL);
        const storedPassword = localStorage.getItem(LOCAL_STORAGE_KEYS.PASSWORD);

        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setEmail(storedEmail);
        if (storedPassword) setPassword(storedPassword);
    }, []);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const sendOTP = async () => {
        // Send a request to your server to generate and send OTP
        try {
            console.log("hhhhhhhh")
            const response = await axios.post('http://localhost:5000/genotp', {
                userId: 
                email,
            });
            console.log("hhhhhhhh")

            if (response.data.success) {
                toast.success('OTP sent successfully', {
                    position: 'bottom-right',
                    autoClose: 1400,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'light',
                });

                setTimeout(() => {
                    navigate('/verify');
                }, 1800);
            } else {
                console.error('Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    };

    const handleSubmit = () => {
        // Save values to local storage
        localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, username);
        localStorage.setItem(LOCAL_STORAGE_KEYS.EMAIL, email);
        localStorage.setItem(LOCAL_STORAGE_KEYS.PASSWORD, password);

        if (password === confirmPassword) {
            // Passwords match, send OTP
            sendOTP();
        } else {
            // Passwords don't match
            console.error('Password and confirm password do not match');
        }
    };

    return (
        <div className="modal modal-signin position-static d-block py-2" tabIndex="-1" role="dialog" id="modalSignin">

            <ToastContainer
                position="bottom-right"
                autoClose={1400}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <div className="modal-dialog" role="document">
                <div className="modal-content rounded-4 shadow">
                    <div className="modal-header p-5 pb-4 border-bottom-0">
                        <h1 className="fw-bold mb-0 fs-2">Sign up for free</h1>
                    </div>
                    <div className="modal-body p-5 pt-0">
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control rounded-3"
                                id="username"
                                name="uname"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <label htmlFor="username">Username</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                className="form-control rounded-3"
                                id="email"
                                name="mail"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label htmlFor="email">Email address</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                className="form-control rounded-3"
                                id="password"
                                name="key"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <label htmlFor="password">Password</label>
                        </div>
                        <div className="form-floating mb-3">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                className="form-control rounded-3"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <label htmlFor="confirmPassword">Confirm Password</label>
                        </div>
                        <div className="col-10 d-flex">
                            <input type="checkbox" className="form-check-input mx-2" id="showConfirmPassword" onChange={togglePasswordVisibility} />
                            <p>Show password</p>
                        </div>
                        <button className="w-100 mb-2 btn btn-lg rounded-3 btn-primary" type="button" onClick={handleSubmit}>
                            Sign up
                        </button>
                        <small className="text-muted">By clicking Sign up, you agree to the terms of use.</small>
                        <br />
                        <small className="text-muted">
                            Already have an account? <Link to="/login">Login</Link>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
