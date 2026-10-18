from pathlib import Path
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "extracted" / "WELFake_Dataset.csv"
MODEL_DIR = ROOT / "models"
MODEL_PATH = MODEL_DIR / "fake_news_pipeline.joblib"

print("Loading WELFake dataset...")
df = pd.read_csv(
    DATA_PATH,
    usecols=["title", "text", "label"],
    encoding="utf-8"
)

df["title"] = df["title"].fillna("").astype(str).str.strip()
df["text"] = df["text"].fillna("").astype(str).str.strip()
df["label"] = pd.to_numeric(df["label"], errors="coerce")

df = df.dropna(subset=["label"])
df = df[df["label"].isin([0, 1])].copy()
df["label"] = df["label"].astype(int)

df["content"] = (
    df["title"] + " " + df["text"]
).str.strip()

df = df[df["content"].str.len() >= 30].copy()
df = df.drop_duplicates(subset=["content"])

print("Usable articles:", len(df))
print("Label counts:")
print(df["label"].value_counts().sort_index())
print("Label 0 = Real; label 1 = Fake")

X = df["content"]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

pipeline = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            stop_words="english",
            max_features=100000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.98,
            sublinear_tf=True
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        )
    )
])

print("\nTraining model. This may take several minutes...")
pipeline.fit(X_train, y_train)

predictions = pipeline.predict(X_test)

print("\n========== TEST RESULTS ==========")
print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")
print("\nClassification report:")
print(classification_report(
    y_test,
    predictions,
    labels=[0, 1],
    target_names=["Real", "Fake"],
    digits=4
))
print("Confusion matrix (rows=true, columns=predicted; Real, Fake):")
print(confusion_matrix(y_test, predictions, labels=[0, 1]))

MODEL_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(pipeline, MODEL_PATH)

print("\nModel saved to:", MODEL_PATH)
print("Training completed.")
