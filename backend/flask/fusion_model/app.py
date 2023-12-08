# Imports of work 

from datasets import load_dataset
import os
from PIL import Image
from datasets import load_dataset, set_caching_enabled
from typing import Dict, List, Optional, Tuple
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from dataclasses import dataclass
from flask import Flask, request, jsonify
from transformers import (
    AutoTokenizer, AutoFeatureExtractor, AutoModel,TrainingArguments, Trainer,logging
)
import pickle
import base64
from io import BytesIO
from IPython.display import display
import pickle
import torch
import io
import re

app = Flask(__name__)

# Load the dataset
dataset = load_dataset(
    "csv",
    data_files={
        "train": os.path.join("..", r"C:\Users\Vishnu\Documents\Gitprojects\ps\pathvqa\model", "trainpvqaimg.csv"),
        "test": os.path.join("..", r"C:\Users\Vishnu\Documents\Gitprojects\ps\pathvqa\model", "testpvqaimg.csv")
    }
)

with open(os.path.join("..", r"C:\Users\Vishnu\Documents\Gitprojects\ps\pathvqa\model", "unique_answers.txt")) as f:
    YNSanswer_space = f.read().splitlines()

# Map function to process the dataset
def process_example(example):
    labels = []
    for ans in example['answer']:
        ans_cleaned = ans.replace(" ", "").split(",")[0]
        try:
            label = YNSanswer_space.index(ans_cleaned)
        except ValueError:
            label = -1  # or another default label
        labels.append(label)
    return {'label': labels}

# Apply the map function to the dataset
dataset = dataset.map(process_example, batched=True)


device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(device)

if device.type == 'cuda':
    print("my gpu is rtx ok??",torch.cuda.get_device_name(0))
    


@dataclass
class MultimodalCollator:
    tokenizer: AutoTokenizer
    preprocessor: AutoFeatureExtractor

    def tokenize_text(self, texts: List[str]):
        encoded_text = self.tokenizer(
            text=texts,
            padding='longest',
            max_length=24,
            truncation=True,
            return_tensors='pt',
            return_token_type_ids=True,
            return_attention_mask=True,
        )
        return {
            "input_ids": encoded_text['input_ids'].squeeze(),
            "token_type_ids": encoded_text['token_type_ids'].squeeze(),
            "attention_mask": encoded_text['attention_mask'].squeeze(),
        }

    def preprocess_images(self, images: List[str]):
        processed_images = self.preprocessor(
            images=[Image.open(os.path.join("..", r"C:\Users\Vishnu\Documents\Gitprojects\ps\pathvqa\train",   image_id + ".jpg")).convert('RGB') for image_id in images],
            return_tensors="pt",
        )
        return {
            "pixel_values": processed_images['pixel_values'].squeeze(),
        }

    def __call__(self, raw_batch_dict):
        return {
            **self.tokenize_text(
                raw_batch_dict['question']
                if isinstance(raw_batch_dict, dict) else
                [i['question'] for i in raw_batch_dict]
            ),
            **self.preprocess_images(
                raw_batch_dict['image']
                if isinstance(raw_batch_dict, dict) else
                [i['image'] for i in raw_batch_dict]
            ),
            'labels': torch.tensor(
                raw_batch_dict['label']
                if isinstance(raw_batch_dict, dict) else
                [i['label'] for i in raw_batch_dict],
                dtype=torch.int64
            ),
        }
          
class MultimodalVQAModel(nn.Module):
    def __init__(
            self,
            num_labels: int = len(YNSanswer_space),
            intermediate_dim: int = 512,
            pretrained_text_name: str = 'bert-base-uncased',
            pretrained_image_name: str = 'google/vit-base-patch16-224-in21k'):

        super(MultimodalVQAModel, self).__init__()
        self.num_labels = num_labels
        self.pretrained_text_name = pretrained_text_name
        self.pretrained_image_name = pretrained_image_name

        self.text_encoder = AutoModel.from_pretrained(
            self.pretrained_text_name,
        )
        self.image_encoder = AutoModel.from_pretrained(
            self.pretrained_image_name,
        )
        self.fusion = nn.Sequential(
            nn.Linear(self.text_encoder.config.hidden_size + self.image_encoder.config.hidden_size, intermediate_dim),
            nn.ReLU(),
            nn.Dropout(0.5),
        )

        self.classifier = nn.Linear(intermediate_dim, self.num_labels)

        self.criterion = nn.CrossEntropyLoss()

    def forward(
            self,
            input_ids: torch.LongTensor,
            pixel_values: torch.FloatTensor,
            attention_mask: Optional[torch.LongTensor] = None,
            token_type_ids: Optional[torch.LongTensor] = None,
            labels: Optional[torch.LongTensor] = None):

        encoded_text = self.text_encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            return_dict=True,
        )
        encoded_image = self.image_encoder(
            pixel_values=pixel_values,
            return_dict=True,
        )
        fused_output = self.fusion(
            torch.cat(
                [
                    encoded_text['pooler_output'],
                    encoded_image['pooler_output'],
                ],
                dim=1
            )
        )
        logits = self.classifier(fused_output)

        out = {
            "logits": logits
        }
        if labels is not None:
            loss = self.criterion(logits, labels)
            out["loss"] = loss
            
        return out

def createMultimodalVQACollatorAndModel(text='bert-base-uncased', image='google/vit-base-patch16-224-in21k'):
    tokenizer = AutoTokenizer.from_pretrained(text)
    preprocessor = AutoFeatureExtractor.from_pretrained(image)

    multi_collator = MultimodalCollator(
        tokenizer=tokenizer,
        preprocessor=preprocessor,
    )


    multi_model = MultimodalVQAModel(pretrained_text_name=text, pretrained_image_name=image).to(device)
    return multi_collator, multi_model

args = TrainingArguments(
    output_dir="checkpoint",
    seed=12345,
    evaluation_strategy="steps",
    eval_steps=100,
    logging_strategy="steps",
    logging_steps=100,
    save_strategy="steps",
    save_steps=100,
    save_total_limit=3,             # Save only the last 3 checkpoints at any given time while training
    metric_for_best_model='wups',
    per_device_train_batch_size=32,
    per_device_eval_batch_size=32,
    remove_unused_columns=False,
    num_train_epochs=10,
    fp16=False,
    # warmup_ratio=0.01,
    # learning_rate=5e-4,
    # weight_decay=1e-4,
    # gradient_accumulation_steps=2,
    dataloader_num_workers=8,
    load_best_model_at_end=True,
)




with open(r"C:\Users\Vishnu\Documents\Gitprojects\ps\pathvqa\modelcol.pkl", 'rb') as file:
    loaded_collator, loaded_model = pickle.load(file)
    loaded_model.to(device) 



# Specify the folder where uploaded images will be stored
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def showExample(train=True, id=None, question=None, image=None):
    if train:
        data = dataset["train"]
    else:
        data = dataset["test"]
    if id is None:
        id = np.random.randint(len(data))
        
    # Find the index of the example in the dataset based on image and question
    index = next((i for i, item in enumerate(data) if item["image"] == image and item["question"] == question), None)

    if index is not None:
        print("Question: \t", data[index]["question"])
        print("Actual answer:\t", data[index]["answer"], "(Label: {0})".format(data[index]["label"]))
    else:
        print("Example not found in the dataset.")
        
        
        
@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("hello im app start")
        input_data = request.get_json()
        question = input_data['question']
        print(question)
        image_data = input_data['data']
        filename = input_data.get('name', 'default_filename.jpg')
        
        l1 = filename
        actual_image=l1[:-4]
        

        # Ensure the image data is a bytes-like object
        image_bytes = base64.b64decode(image_data)

        # Convert bytes to image
        image = Image.open(BytesIO(image_bytes))

        # Save the image to the upload folder with the original filename
        filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        print("the image name is: ",filename)
        image.save(filename)
        
        
        
        user_input = [
            {'image': actual_image, 'question': question, 'answer': 'yes', 'label': 143},
            {'image': actual_image, 'question': question, 'answer': 'yes', 'label': 239},
            {'image': actual_image, 'question': question, 'answer': 'yes', 'label': 121}
        ]

        preps = user_input  # Adjust the range based on how many elements you want to include
        print(dataset["test"][3246])
        print("hello baaka...")
        
        print(dataset["test"][3246:3249])
        # preps = dataset["test"][100:102]

        print("hell 1")
        samples = loaded_collator(preps)

        print("hell 2")

        # Extract processed data from the collated samples
        input_ids = samples["input_ids"].to(device)
        token_type_ids = samples["token_type_ids"].to(device)
        attention_mask = samples["attention_mask"].to(device)
        pixel_values = samples["pixel_values"].to(device)

        print("hell 4")
        loaded_output = loaded_model(input_ids, pixel_values, attention_mask, token_type_ids)
        print("hell 5")

        loaded_preds = loaded_output["logits"].argmax(axis=-1).cpu().numpy()
        print("hell 6")
        print(loaded_preds)

        
        print("*********************************************************")
        showExample(train=False, id=0,question=question,image=actual_image)
        
        print("Predicted Answer:\t", YNSanswer_space[loaded_preds[0]])
        print("*********************************************************")
            
            
        # Return the prediction
        output = YNSanswer_space[loaded_preds[0]]
        print(output)
        
        result = {'prediction':output}
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = 8000
    print(f"Starting the app on port {port}")
    app.run(debug=True, port=port)