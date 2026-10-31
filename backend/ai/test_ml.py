
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "scam_detector.joblib"

model = joblib.load(MODEL_PATH)

messages = [
    "URGENT! Your KYC will expire today. Click this link.",
    "Your UPI payment was successful. Thank you.",
    "Job confirm karne ke liye registration fee pay karo.",
    "Aapka mobile recharge successfully ho gaya hai."
]

for message in messages:
    prediction = model.predict([message])[0]
    probabilities = model.predict_proba([message])[0]
    confidence = max(probabilities) * 100

    print("\nMessage:", message)
    print("Prediction:", prediction)
    print(f"Model confidence: {confidence:.2f}%")
