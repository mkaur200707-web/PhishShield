
import os
import json
import joblib
import numpy as np
import pandas as pd
import torch

from transformers import AutoTokenizer, AutoModel
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# ---------------- CONFIGURATION ----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "messages.csv")

MODEL_NAME = "FacebookAI/xlm-roberta-base"
MAX_LENGTH = 96
BATCH_SIZE = 2
RANDOM_STATE = 42

MODEL_OUTPUT = os.path.join(BASE_DIR, "xlmr_frozen_classifier.joblib")
CONFIG_OUTPUT = os.path.join(BASE_DIR, "xlmr_frozen_config.json")

# ---------------- DEVICE ----------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Device:", device)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
    torch.cuda.empty_cache()

# ---------------- LOAD DATASET ----------------

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)
df = df.dropna(subset=["message", "label"])

df["message"] = df["message"].astype(str)
df["label"] = df["label"].astype(str).str.upper().str.strip()

df = df[df["label"].isin(["SCAM", "LEGITIMATE"])]

X = df["message"].tolist()
y = df["label"].tolist()

print("Total messages:", len(X))
print("Label counts:")
print(df["label"].value_counts())

# Split BEFORE extracting embeddings to avoid leakage
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y
)

# ---------------- LOAD XLM-ROBERTA ----------------

print("\nLoading pretrained XLM-RoBERTa...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
transformer = AutoModel.from_pretrained(MODEL_NAME)

transformer.to(device)
transformer.eval()

# Freeze all transformer weights
for parameter in transformer.parameters():
    parameter.requires_grad = False

print("XLM-RoBERTa loaded and frozen!")

# ---------------- EMBEDDING FUNCTION ----------------

def extract_embeddings(messages):
    all_embeddings = []

    for start in range(0, len(messages), BATCH_SIZE):
        batch = messages[start:start + BATCH_SIZE]

        encoded = tokenizer(
            batch,
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
            outputs = transformer(**encoded)

            hidden_states = outputs.last_hidden_state
            attention_mask = encoded["attention_mask"].unsqueeze(-1)

            masked_embeddings = hidden_states * attention_mask

            summed = masked_embeddings.sum(dim=1)
            counts = attention_mask.sum(dim=1).clamp(min=1)

            embeddings = summed / counts

        all_embeddings.append(embeddings.cpu().numpy())

        if (start // BATCH_SIZE + 1) % 20 == 0:
            print(
                f"Processed {min(start + BATCH_SIZE, len(messages))}"
                f"/{len(messages)} messages"
            )

    return np.concatenate(all_embeddings, axis=0)

# ---------------- EXTRACT FEATURES ----------------

print("\nExtracting training embeddings...")
train_embeddings = extract_embeddings(X_train)

print("\nExtracting testing embeddings...")
test_embeddings = extract_embeddings(X_test)

print("Training embedding shape:", train_embeddings.shape)
print("Testing embedding shape:", test_embeddings.shape)

# ---------------- TRAIN CLASSIFIER ----------------

print("\nTraining Logistic Regression classifier...")

classifier = LogisticRegression(
    max_iter=2000,
    class_weight="balanced",
    random_state=RANDOM_STATE
)

classifier.fit(train_embeddings, y_train)

# ---------------- EVALUATION ----------------

predictions = classifier.predict(test_embeddings)

print("\nAccuracy:", accuracy_score(y_test, predictions))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)

print("\nConfusion Matrix:")
print(confusion_matrix(
    y_test,
    predictions,
    labels=["LEGITIMATE", "SCAM"]
))

# ---------------- SAVE MODEL ----------------

joblib.dump(classifier, MODEL_OUTPUT)

config = {
    "model_name": MODEL_NAME,
    "max_length": MAX_LENGTH,
    "labels": list(classifier.classes_),
    "method": "Frozen XLM-RoBERTa embeddings + Logistic Regression"
}

with open(CONFIG_OUTPUT, "w", encoding="utf-8") as file:
    json.dump(config, file, indent=4)

print("\nTraining completed successfully!")
print("Classifier saved:", MODEL_OUTPUT)
print("Configuration saved:", CONFIG_OUTPUT)