from PIL import Image
from flask import Flask, request, jsonify
import os
import base64
from io import BytesIO

import torch
import pickle
from transformers import BlipForQuestionAnswering, BlipProcessor, BlipImageProcessor
from PIL import Image


text_processor = BlipProcessor.from_pretrained("Salesforce/blip-vqa-base")
image_processor = BlipImageProcessor.from_pretrained("Salesforce/blip-vqa-base")

# model_path = "C:\\Users\\Vishnu\\Documents\\Gitprojects\\ps\\pathvqa\\BLIP_All_img_50_epochs.pkl"
model_path = "C:\\Users\\Vishnu\\Documents\\Gitprojects\\ps\\pathvqa\\BLIP_epochs_50.pkl"

# Check for CUDA availability
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load the model onto the appropriate device
loaded_model = torch.load(model_path, map_location=device)

def generate_answer(image_path, question_text):
    image = Image.open(image_path).convert('RGB')
    image_encoding = image_processor(image, do_resize=True, size=(128, 128), return_tensors="pt")
    
    encoding = text_processor(
        None,
        question_text,
        padding="max_length",
        truncation=True,
        max_length=32,
        return_tensors="pt"
    )

    encoding["pixel_values"] = image_encoding["pixel_values"]
    
    with torch.no_grad():
        # Move the inputs to the appropriate device
        input_ids = encoding['input_ids'].to(device)
        pixel_values = image_encoding['pixel_values'].to(device)
        
        outputs = loaded_model.generate(input_ids=input_ids, pixel_values=pixel_values)
    
    predicted_answer = text_processor.decode(outputs[0], skip_special_tokens=True)
    
    return predicted_answer


app = Flask(__name__)

# Specify the folder where uploaded images will be stored
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load pre-trained VILT models


@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.get_json()
        question = input_data['question']
        print(question)
        image_data = input_data['data']
        filename = input_data.get('name', 'default_filename.jpg')

        image_bytes = base64.b64decode(image_data)

        image = Image.open(BytesIO(image_bytes))

        filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filename)

        img = Image.open(filename)

        output = generate_answer(filename, question)
        print("Predicted answer:", output)
        output_data = {'prediction': output}
        return jsonify(output_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = 8001
    print(f"Starting the app on port {port}")
    print("running the blip model successfully")
    app.run(debug=True,port=port)
