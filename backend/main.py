
from contextlib import asynccontextmanager
from pathlib import Path

import json
import joblib
import torch

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModel


# ---------------- PATHS AND MODEL STATE ----------------

BASE_DIR = Path(__file__).resolve().parent
AI_DIR = BASE_DIR / "ai"

CLASSIFIER_PATH = AI_DIR / "xlmr_frozen_classifier.joblib"
CONFIG_PATH = AI_DIR / "xlmr_frozen_config.json"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

classifier = None
tokenizer = None
transformer = None
max_length = 96


# ---------------- LOAD MODEL WHEN SERVER STARTS ----------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global classifier, tokenizer, transformer, max_length

    if not CLASSIFIER_PATH.exists() or not CONFIG_PATH.exists():
        raise RuntimeError("Trained XLM-R classifier or config file not found.")

    print("Loading PhishShield AI model...")

    classifier = joblib.load(CLASSIFIER_PATH)

    with open(CONFIG_PATH, "r", encoding="utf-8") as file:
        config = json.load(file)

    max_length = config["max_length"]
    model_name = config["model_name"]

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    transformer = AutoModel.from_pretrained(model_name).to(device)
    transformer.eval()

    for parameter in transformer.parameters():
        parameter.requires_grad = False

    print(f"PhishShield AI loaded successfully on {device}!")

    yield

    transformer = None
    classifier = None
    tokenizer = None


# ---------------- FASTAPI APP ----------------

app = FastAPI(
    title="PhishShield Bharat API",
    description="AI-powered Indian scam and phishing detection API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- REQUEST FORMAT ----------------

class AnalyzeRequest(BaseModel):
    message: str = Field(min_length=3, max_length=5000)


# ---------------- EMBEDDING FUNCTION ----------------

def get_embedding(message: str):
    encoded = tokenizer(
        [message],
        padding=True,
        truncation=True,
        max_length=max_length,
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

        embedding = (
            (hidden * mask).sum(dim=1)
            / mask.sum(dim=1).clamp(min=1)
        )

    return embedding.cpu().numpy()


# ---------------- BASIC INDICATORS ----------------

def find_indicators(message: str):
    text = message.lower()
    indicators = []

    patterns = {
        "Urgent or threatening language": [
            "urgent", "immediately", "expire today",
            "account blocked", "suspend", "last warning"
        ],
        "KYC or banking request": [
            "kyc", "bank account", "pan card",
            "aadhaar", "account verification"
        ],
        "OTP or PIN request": [
            "otp", "one time password", "upi pin",
            "share your pin"
        ],
        "Payment or registration fee request": [
            "registration fee", "processing fee",
            "pay now", "send money"
        ],
        "Prize or reward claim": [
            "winner", "lottery", "prize",
            "claim reward", "cashback"
        ],
        "Suspicious link wording": [
            "click this link", "verify here",
            "open this link", "click here"
        ]
    }

    for label, keywords in patterns.items():
        if any(keyword in text for keyword in keywords):
            indicators.append(label)

    return indicators


# ---------------- API ROUTES ----------------

@app.get("/")
def home():
    return {
        "message": "Welcome to PhishShield Bharat API!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": classifier is not None,
        "device": str(device)
    }


@app.post("/analyze")
def analyze_message(request: AnalyzeRequest):
    if classifier is None or transformer is None or tokenizer is None:
        raise HTTPException(
            status_code=503,
            detail="AI model is not ready."
        )

    message = request.message.strip()

    if len(message) < 3:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid message."
        )

    try:
        features = get_embedding(message)

        prediction = classifier.predict(features)[0]
        probabilities = classifier.predict_proba(features)[0]

        classes = list(classifier.classes_)
        scam_index = classes.index("SCAM")

        # This is an uncalibrated model score, not a real-world probability.
        scam_score = float(probabilities[scam_index]) * 100

        if scam_score >= 75:
            risk_level = "HIGH"
        elif scam_score >= 45:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        indicators = find_indicators(message)

        if prediction == "SCAM":
            explanation = (
                "The AI model classified this message as suspicious. "
                "Review the indicators before taking action."
            )
            safety_advice = [
                "Do not click suspicious links.",
                "Never share your OTP, UPI PIN or passwords.",
                "Verify requests through the official bank or service.",
                "Do not send money under pressure."
            ]
        else:
            explanation = (
                "The AI model classified this message as legitimate. "
                "Still verify unexpected requests independently."
            )
            safety_advice = [
                "Never share your OTP or UPI PIN.",
                "Check the sender before sharing personal information.",
                "Use official apps and websites for payments."
            ]

        return {
            "risk_level": risk_level,
            "risk_score": round(scam_score, 2),
            "ml_prediction": prediction,
            "dl_prediction": "NOT_RUN",
            "model_prediction": prediction,
            "explanation": explanation,
            "indicators": indicators,
            "safety_advice": safety_advice,
            "score_note": (
                "Uncalibrated model score; not a verified scam probability."
            )
        }

    except Exception as error:
        print("Analysis error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Message analysis failed."
        )
