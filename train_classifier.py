"""
UrbanAssist AI - department classifier training script.

Data source: NYC Open Data 311 Service Requests (Socrata API), dataset id erm2-nwe9.
https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9

This is a real, live public dataset with millions of real citizen complaints
labeled with the government agency that handled them. We map NYC agencies to
our six Indian civic departments (Water, Roads, Electricity, Sanitation are
well represented; Civil Registration and Property Tax are NOT NYC 311
categories, so we augment those two with a small handwritten seed set below).

Run:
    pip install -r requirements.txt
    python train_classifier.py

Output:
    model.joblib        -> trained TF-IDF + LogisticRegression pipeline
    label_map.json       -> class index -> department key
"""

import json
import requests
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

SOCRATA_BASE = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"

# NYC agency -> our department key. Only pull rows for these agencies.
AGENCY_TO_DEPT = {
    "DEP": "water",         # Dept of Environmental Protection -> water/sewer complaints
    "DOT": "roads",         # Dept of Transportation -> potholes/street/sidewalk/streetlights
    "DSNY": "sanitation",   # Dept of Sanitation -> garbage/dirty conditions
}

# DOT complaint_types that are actually electricity-adjacent (streetlights, traffic signals)
ELECTRICITY_TYPES = {"street light condition", "traffic signal condition", "lamppost", "lamp post"}

# We only want actual water-related complaints from DEP, excluding noise, air, etc.
WATER_SEWER_TYPES = {
    "water system", "sewer", "water quality", "fat oil grease", "water conservation",
    "clogged catch basin", "sewage backup", "leaking hydrant", "no water", "low water pressure"
}

ROWS_PER_AGENCY = 4000


def fetch_agency_rows(agency: str) -> pd.DataFrame:
    """Pull recent complaint text + type for one agency via the Socrata API."""
    params = {
        "$select": "complaint_type,descriptor,agency",
        "$where": f"agency = '{agency}'",
        "$limit": ROWS_PER_AGENCY,
        "$order": "created_date DESC",
    }
    resp = requests.get(SOCRATA_BASE, params=params, timeout=60)
    resp.raise_for_status()
    return pd.DataFrame(resp.json())


def build_text_and_label(row) -> tuple[str, str]:
    complaint_type = str(row.get("complaint_type", "") or "")
    descriptor = str(row.get("descriptor", "") or "")
    text = f"{complaint_type}. {descriptor}".strip()

    agency = row.get("agency")
    dept = AGENCY_TO_DEPT.get(agency)

    # Filter out DEP noise and non-water complaints to keep department data clean
    if agency == "DEP":
        matched = False
        for wt in WATER_SEWER_TYPES:
            if wt in complaint_type.lower() or wt in descriptor.lower():
                matched = True
                break
        if not matched:
            dept = None

    elif agency == "DOT" and complaint_type.lower() in ELECTRICITY_TYPES:
        dept = "electricity"
    return text, dept


# Handwritten seed examples for the two departments NYC 311 doesn't cover.
SYNTHETIC_SEED = [
    # --- CIVIL (Civil Registration / Certificates) ---
    ("Birth certificate application pending for over a month, no update", "civil"),
    ("Need correction in name spelling on my birth certificate", "civil"),
    ("Death certificate not issued yet, urgently required for insurance", "civil"),
    ("Marriage certificate registration delayed at municipal office", "civil"),
    ("Applied for birth certificate online, status still shows pending", "civil"),
    ("Requesting duplicate birth certificate copy, original lost", "civil"),
    ("Death certificate has wrong date of birth of deceased", "civil"),
    ("Marriage certificate not received after 3 weeks of application", "civil"),
    ("Need correction in spelling of father's name on my birth certificate.", "civil"),
    ("Applied online for birth certificate duplicate copy, online status shows pending.", "civil"),
    ("Correction of name on my daughter's birth certificate is delayed.", "civil"),
    ("Spelling correction needed for spouse name on marriage certificate.", "civil"),
    ("Death certificate registration delay at the local municipal ward office.", "civil"),
    ("Applied for child name inclusion in birth certificate, no response.", "civil"),
    ("Marriage certificate shows incorrect date of marriage, need rectification.", "civil"),
    ("Where do I apply for a new birth certificate for a newborn?", "civil"),
    ("Correction of address on birth certificate is pending for three weeks.", "civil"),
    ("Municipal registration office closed during working hours, cannot submit marriage application.", "civil"),
    ("Need verification of birth record from municipal archives for passport.", "civil"),
    ("Applied for late registration of birth, document validation delayed.", "civil"),
    ("Is there a portal to download death certificate online?", "civil"),
    ("Municipal council office charging extra fees for marriage certificate registration.", "civil"),
    ("Death certificate has wrong age of the deceased listed.", "civil"),
    ("Applied for correction in place of birth on my certificate.", "civil"),
    ("Name spelling correction in marriage certificate registration copy.", "civil"),
    ("Pending verification of marriage license from registrar office.", "civil"),
    ("Unable to download birth certificate copy from the online civic dashboard.", "civil"),
    ("Officer refusing to process death certificate application without additional papers.", "civil"),
    ("Online portal showing database error when trying to download marriage certificate.", "civil"),
    ("Applied for birth registration but registrar hasn't signed the certificate yet.", "civil"),

    # --- REVENUE (Revenue / Property Tax) ---
    ("Property tax bill shows incorrect built-up area for my house", "revenue"),
    ("Need correction in property tax assessment, wrong ownership listed", "revenue"),
    ("Property tax paid but portal still shows outstanding dues", "revenue"),
    ("Requesting property tax reassessment after renovation", "revenue"),
    ("Property tax receipt not generated after online payment", "revenue"),
    ("Land revenue records show wrong plot dimensions", "revenue"),
    ("Property tax notice sent to wrong address, need correction", "revenue"),
    ("Applied for property tax name transfer, no response in weeks", "revenue"),
    ("Property tax bill shows incorrect built-up area for my residential apartment.", "revenue"),
    ("Correction in property tax assessment record needed, wrong owner name listed.", "revenue"),
    ("Paid property tax online but payment receipt not generated, amount deducted.", "revenue"),
    ("Property tax portal shows outstanding dues even after successful payment.", "revenue"),
    ("Requesting property tax reassessment after renovation and reduction in commercial space.", "revenue"),
    ("Property tax notice sent to wrong address, please update communication address.", "revenue"),
    ("Applied for property tax name transfer (mutation) after sale, no response.", "revenue"),
    ("Land revenue records show incorrect plot dimensions and boundaries.", "revenue"),
    ("Double payment of property tax debited from bank account, need refund.", "revenue"),
    ("Property tax assessment calculation is too high, need valuation review.", "revenue"),
    ("Received notice for unpaid property tax, but I have paid all bills.", "revenue"),
    ("Applied for tax exemption certificate for my property, pending approval.", "revenue"),
    ("Property tax calculation discrepancy for agricultural land conversion.", "revenue"),
    ("Where can I obtain the mutation certificate for my registered land?", "revenue"),
    ("Incorrect annual rateable value (ARV) applied to my residential building.", "revenue"),
    ("Property tax department website not loading, unable to file annual return.", "revenue"),
    ("Need correction in land survey number in property tax account details.", "revenue"),
    ("Mutation of property name change pending at revenue department for two months.", "revenue"),
    ("Property tax payment portal says my assessment number is invalid.", "revenue"),
    ("Revenue inspector demanding bribes for property mutation certificate.", "revenue"),
    ("Commercial tax rate applied instead of residential rate on my property bill.", "revenue"),
    ("Did not receive property tax bill for the current financial year.", "revenue"),
    ("Portal does not show tax concession for senior citizens on property tax.", "revenue"),
    ("Need property tax ledger statement for last 5 years for loan processing.", "revenue"),
    ("Applied for correction of land category from commercial to residential.", "revenue"),
]


def main():
    print("Fetching live 311 data from NYC Open Data (Socrata API)...")
    frames = []
    for agency in AGENCY_TO_DEPT:
        print(f"  -> {agency} ({ROWS_PER_AGENCY} rows)")
        frames.append(fetch_agency_rows(agency))
    raw = pd.concat(frames, ignore_index=True)

    texts, labels = [], []
    for _, row in raw.iterrows():
        text, dept = build_text_and_label(row)
        if dept and text:
            texts.append(text)
            labels.append(dept)

    for text, dept in SYNTHETIC_SEED:
        texts.append(text)
        labels.append(dept)

    df = pd.DataFrame({"text": texts, "label": labels})
    df = df.drop_duplicates(subset="text")
    print("\nOriginal unique sample counts per class:")
    print(df["label"].value_counts())

    # Split into train/test first (test set has zero oversampled rows, avoiding data leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["label"], test_size=0.15, random_state=42, stratify=df["label"]
    )

    # Oversample minority classes only in training data to balance training load
    train_df = pd.DataFrame({"text": X_train, "label": y_train})
    class_counts = train_df["label"].value_counts()
    mean_major_count = int(class_counts.drop(["civil", "revenue"], errors="ignore").mean())
    target_count = max(mean_major_count, 300)

    oversampled_frames = [train_df]
    for m_class in ["civil", "revenue"]:
        m_df = train_df[train_df["label"] == m_class]
        if not m_df.empty:
            needed = target_count - len(m_df)
            if needed > 0:
                oversampled_frames.append(m_df.sample(n=needed, replace=True, random_state=42))
    
    train_df = pd.concat(oversampled_frames, ignore_index=True)
    X_train = train_df["text"]
    y_train = train_df["label"]

    print("\nOversampled training set class counts:")
    print(y_train.value_counts())

    # Build Pipeline with TfidfVectorizer and LogisticRegression (to support predict_proba)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=30000)),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    print("\n=== Evaluation on held-out test set ===")
    print(classification_report(y_test, preds))

    joblib.dump(pipeline, "model.joblib")
    
    # Save the labels mapped to department keys
    classes_list = sorted(df["label"].unique().tolist())
    with open("label_map.json", "w") as f:
        json.dump(classes_list, f)

    print("\nSaved model.joblib and label_map.json")


if __name__ == "__main__":
    main()
