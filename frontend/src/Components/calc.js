// src/components/Calculator.js

import React, { useState } from 'react';
import axios from 'axios';

const Calculator = () => {
    const [number, setNumber] = useState('');
    const [operation, setOperation] = useState('');
    const [result, setResult] = useState(null);

    const handleFetch = async () => {
        if (number !== '' && operation !== '') {
            try {
                const response = await axios.post(
                    'http://localhost:5000/calc',
                    { number, operation },
                    { withCredentials: true }
                );

                setResult(response.data.result);
            } catch (error) {
                console.error('Error fetching data:', error);
                setResult(null);
            }
        } else {
            alert('Please enter a number and select an operation.');
        }
    };

    return (
        <div className='container my-5 p-5'>
            <h1>Hello world</h1>
            <p>Square and cube teller</p>
            <input
                type="text"
                placeholder="Enter a number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
            />
            <br /><br />
            <input
                type="radio"
                value="square"
                name="operation"
                checked={operation === 'square'}
                onChange={() => setOperation('square')}
            />
            <label>Square</label><br />
            <input
                type="radio"
                value="cube"
                name="operation"
                checked={operation === 'cube'}
                onChange={() => setOperation('cube')}
            />
            <label>Cube</label><br /><br /><br />
            <button onClick={handleFetch}>Fetch</button>

            {result !== null && (
                <div>
                    <br /><br />
                    <h5>Result: {result}</h5>
                </div>
            )}
        </div>
    );
};

export default Calculator;
