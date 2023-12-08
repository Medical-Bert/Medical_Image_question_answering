from PIL import Image
from flask import Flask, request, jsonify
import os
import base64
from io import BytesIO

from transformers import ViltProcessor, ViltForQuestionAnswering

app = Flask(__name__)

# Specify the folder where uploaded images will be stored
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load pre-trained VILT models
processor = ViltProcessor.from_pretrained("dandelin/vilt-b32-finetuned-vqa")
model = ViltForQuestionAnswering.from_pretrained("dandelin/vilt-b32-finetuned-vqa")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.get_json()
        question = input_data['question']
        print(question)
        image_data = input_data['data']
        filename = input_data.get('name', 'default_filename.jpg')

        # Ensure the image data is a bytes-like object
        image_bytes = base64.b64decode(image_data)

        # Convert bytes to image
        image = Image.open(BytesIO(image_bytes))

        # Save the image to the upload folder with the original filename
        filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filename)

        # Process the image and questio
        
        img =Image.open(filename)
        encoding = processor(img, question, return_tensors="pt")

        # Forward pass
        outputs = model(**encoding)
        logits = outputs.logits
        idx = logits.argmax(-1).item()
        print("Predicted answer:", model.config.id2label[idx])
        output = model.config.id2label[idx]
        output_data = {'prediction': output}
        return jsonify(output_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = 8000
    print(f"Starting the app on port {port}")
    print("running the vilt model successfully")
    app.run(debug=True, port=port)
