
import os
import json
import joblib
import torch
import numpy as np

from transformers import AutoTokenizer, AutoModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "xlmr_frozen_classifier.joblib")
CONFIG_PATH = os.path.join(BASE_DIR, "xlmr_frozen_config.json")

# Load saved classifier and configuration
classifier = joblib.load(MODEL_PATH)

with open(CONFIG_PATH, "r", encoding="utf-8") as file:
    config = json.load(file)

MODEL_NAME = config["model_name"]
MAX_LENGTH = config["max_length"]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Loading tokenizer and XLM-RoBERTa...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
transformer = AutoModel.from_pretrained(MODEL_NAME).to(device)
transformer.eval()

for parameter in transformer.parameters():
    parameter.requires_grad = False


def predict_message(message):
    encoded = tokenizer(
        [message],
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )

    encoded = {
        key: value.to(device)
        for key, value in encoded.items()
    }

    with torch.inference_mode():
        output = transformer(**encoded)
        hidden = output.last_hidden_state
        mask = encoded["attention_mask"].unsqueeze(-1)

        embedding = (hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)

    features = embedding.cpu().numpy()

    prediction = classifier.predict(features)[0]
    probabilities = classifier.predict_proba(features)[0]

    print("\nMessage:", message)
    print("Prediction:", prediction)
    print("Classifier score:", round(float(np.max(probabilities)) * 100, 2), "%")


test_messages = [
    "URGENT! Your bank KYC will expire today. Click this link immediately.",
    "Your UPI payment was successful. Thank you.",
    "Job confirm karne ke liye registration fee pay karo.",
    "Aapka mobile recharge successfully ho gaya hai."
]

for message in test_messages:
    predict_message(message)
