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


# Expanded seed examples representing typical Indian civic complaints.
SYNTHETIC_SEED = [
    # --- WATER & SEWERAGE (water) ---
    ("Water leakage from the main municipal pipeline on Mahatma Gandhi road", "water"),
    ("Sewage water is overflowing from the manhole near our street junction", "water"),
    ("Drinking water supplied by municipal corporation is muddy and foul smelling", "water"),
    ("No water supply in our locality for the past three days, please resolve", "water"),
    ("Very low water pressure in the pipelines, unable to fill domestic tanks", "water"),
    ("Contaminated water coming from municipal tap, causing health concerns", "water"),
    ("Sewer line is completely blocked near house number 45, causing backflow", "water"),
    ("Clogged catch basin on main market road leading to waterlogging", "water"),
    ("Public drinking water fountain is broken and continuously leaking", "water"),
    ("Open manhole in the sewer line near the primary school is dangerous", "water"),
    ("Frequent sewage backup in the ground floor bathrooms of our apartment", "water"),
    ("Municipal water tanker has not visited our ward this week despite requests", "water"),
    ("Water supply valve is damaged and leaking water onto the footpath", "water"),
    ("Drainage line leakage is contaminating the ground water supply", "water"),
    ("Urgent repair needed for the rusted water mains in Ward 12", "water"),
    ("Sewer pipe leakage in the cellar of the shopping complex", "water"),
    ("Illegal connection taken from the main municipal water supply line", "water"),
    ("Stormwater drain is choked with plastic, leading to sewage overflow", "water"),
    ("Municipal borewell pump is burnt and needs immediate replacement", "water"),
    ("Dirty black water coming out of the borewell supply tap", "water"),
    ("Severe sewage odor coming from the open storm water drain", "water"),
    ("Water pipeline burst near the flyover, huge wastage of water", "water"),
    ("Main drain block is causing sewage to enter residential premises", "water"),
    ("Water distribution chamber is broken and overflowing with dirty water", "water"),
    ("Sewage treatment plant in our locality is emitting terrible smell", "water"),

    # --- ROADS & INFRASTRUCTURE (roads) ---
    ("Huge pothole in the middle of the road near the metro station pillar 102", "roads"),
    ("Road asphalt is completely washed away after the heavy rains, difficult to drive", "roads"),
    ("Broken sidewalk pavement blocks make it unsafe for senior citizens to walk", "roads"),
    ("Street excavation done for cable laying is left open and unfinished", "roads"),
    ("Large cracks on the concrete road near the local market plaza", "roads"),
    ("Missing street name sign board at the crossroad corner", "roads"),
    ("Broken speed breaker near the school zone needs to be leveled", "roads"),
    ("Road divider is damaged and broken bricks are scattered on the highway", "roads"),
    ("Potholes on the lane are causing frequent traffic jams and minor accidents", "roads"),
    ("Road widening work has been abandoned halfway, causing dust pollution", "roads"),
    ("Manhole cover on the footpath is broken, high risk for pedestrians", "roads"),
    ("Footpath is completely encroached by street vendors, no space to walk", "roads"),
    ("Gravel and stones left on the road after patch work, vehicles are slipping", "roads"),
    ("Bridge expansion joint is damaged and causing heavy vibrations to cars", "roads"),
    ("Waterlogging on the road due to poor level design and broken road slope", "roads"),
    ("Dangerous curve on the hill road has no safety barrier or reflective signs", "roads"),
    ("Road resurfacing is done unevenly, creating huge bumps on the lane", "roads"),
    ("Pedestrian zebra crossing stripes have faded, need repainting urgently", "roads"),
    ("Underpass road is completely damaged and filled with mud", "roads"),
    ("Fallen tree branch is blocking half of the double lane road", "roads"),

    # --- ELECTRICITY & GRID (electricity) ---
    ("Frequent power cuts and load shedding in our area without prior notice", "electricity"),
    ("Sparking and smoke coming from the local distribution transformer", "electricity"),
    ("High voltage fluctuations are damaging domestic electronic appliances", "electricity"),
    ("Streetlights on the main road are not working, completely dark at night", "electricity"),
    ("Damaged electrical pole is leaning dangerously towards the residential building", "electricity"),
    ("Loose electrical wires are hanging low from the poles, posing hazard", "electricity"),
    ("Dangling live cable on the wet ground after yesterday's storm", "electricity"),
    ("Local transformer blast has caused complete blackout in Ward 15", "electricity"),
    ("Electricity supply meter is faulty and runs extremely fast", "electricity"),
    ("No power supply in the streetlights of our block for a week", "electricity"),
    ("Broken junction box on the electric pole with exposed live wires", "electricity"),
    ("Municipal street light remains switched on during daytime, huge power waste", "electricity"),
    ("Overloaded transformer is making loud humming noise and heating up", "electricity"),
    ("Fallen electric pole blocking the lane access after heavy wind", "electricity"),
    ("Phase cut in the power line, only single phase power is available", "electricity"),
    ("Electricity department team left the cable trenches open near the park", "electricity"),
    ("Power cable insulation is worn out, sparking during light rains", "electricity"),
    ("Voltage drop is so high that air conditioners and pumps are not starting", "electricity"),
    ("Unscheduled electricity power cut is hampering online school exams", "electricity"),
    ("Smart meter display is blank and power connection is disconnected", "electricity"),
    ("electric wire dangling dangerously on footpath in our neighborhood", "electricity"),
    ("sparking transformer near children playground posing danger", "electricity"),
    ("street lights in our sector remain completely dark and unsafe", "electricity"),
    ("loose high-voltage wire dangling near house gate", "electricity"),
    ("electricity transformer sparking during light rains", "electricity"),
    ("unlit street lamps make roads completely pitch black at night", "electricity"),
    ("electric wire dangling dangerously on footpath", "electricity"),
    ("loose electric cable on the footpath", "electricity"),
    ("hanging wires over the footpath", "electricity"),

    # --- SANITATION & WASTE (sanitation) ---
    ("Illegal garbage dumping on the corner of the public playground", "sanitation"),
    ("Public green dustbin is overflowing and stray dogs are littering waste", "sanitation"),
    ("Municipal waste collection truck has not visited our street for 4 days", "sanitation"),
    ("Dead dog/animal carcass lying on the side of the road, bad smell", "sanitation"),
    ("Clogged drainage block filled with plastic bags and household waste", "sanitation"),
    ("Huge pile of construction debris dumped illegally on the green belt", "sanitation"),
    ("Public park is filled with litter, food wrappers, and plastic bottles", "sanitation"),
    ("Street sweepers are not cleaning our sector road regularly", "sanitation"),
    ("Public toilet facility is extremely unhygienic, no running water", "sanitation"),
    ("Dry leaves and plastic waste are being burnt by sweepers, creating smoke", "sanitation"),
    ("Medical waste dumped behind the hospital clinic is hazardous", "sanitation"),
    ("Stagnant water pool near the garbage dump is breeding mosquitoes", "sanitation"),
    ("Fish market waste is thrown directly into the open storm drain", "sanitation"),
    ("Chemical waste from local small scale workshop dumped on public ground", "sanitation"),
    ("Drainage clogging due to solid waste accumulation in the market sewer", "sanitation"),
    ("Municipal bin is broken and all trash is spilling onto the road", "sanitation"),
    ("Dirty mud and garbage accumulated on the road side drains", "sanitation"),
    ("Uncollected wet waste is rotting and attracting flies in the market", "sanitation"),
    ("Silt removed from drains is left on the road side, blocking traffic", "sanitation"),
    ("Public dustbin not cleared for over two weeks, unbearable stench", "sanitation"),

    # --- CIVIL REGISTRATION (civil) ---
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

    # --- REVENUE / PROPERTY TAX (revenue) ---
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

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=30000)),
        ("clf", LogisticRegression(C=10.0, class_weight="balanced", max_iter=1000, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    print("\n=== Evaluation on held-out test set ===")
    print(classification_report(y_test, preds))

    # Define unseen evaluation cases
    validation_tests = [
        ("water supply contaminated with mud in ward 5", "water"),
        ("overflowing sewage line on main bypass road", "water"),
        ("broken water pipe wasting thousands of gallons", "water"),
        ("low pressure in drinking water taps", "water"),
        
        ("deep potholes near flyover causing vehicle damage", "roads"),
        ("sidewalk pavement collapsed near the shopping mall", "roads"),
        ("street construction excavation left incomplete", "roads"),
        ("speed breaker broken and needs leveling", "roads"),
        
        ("frequent power failures and load shedding in society", "electricity"),
        ("electric wire dangling dangerously on footpath", "electricity"),
        ("sparking transformer near children playground", "electricity"),
        ("street lights in our sector remain completely dark", "electricity"),
        
        ("dead dog carcass lying near public park entrance", "sanitation"),
        ("large garbage heap dumped illegally near residential gate", "sanitation"),
        ("overflowing municipal dustbin attracting flies", "sanitation"),
        ("clogged drainage channel full of plastic bags", "sanitation"),
        
        ("birth certificate name spelling mismatch correction", "civil"),
        ("death registration certificate not received online", "civil"),
        ("marriage license registration certificate delay", "civil"),
        ("need duplicate birth certificate issued for visa", "civil"),
        
        ("property tax mutation pending after buying land", "revenue"),
        ("tax billing discrepancy showing wrong carpet area", "revenue"),
        ("property tax receipt not generated but cash debited", "revenue"),
        ("received incorrect penalty warning for property tax", "revenue")
    ]

    print("\n=== Validation Test Suite Accuracy ===")
    correct = 0
    for text, true_label in validation_tests:
        pred_label = pipeline.predict([text])[0]
        is_correct = (pred_label == true_label)
        if is_correct:
            correct += 1
        print(f"  Text: {text[:50]}...")
        print(f"    Expected: {true_label} | Predicted: {pred_label} | {'PASS' if is_correct else 'FAIL'}")
    
    val_accuracy = correct / len(validation_tests)
    print(f"\nValidation Accuracy: {val_accuracy * 100:.2f}% ({correct}/{len(validation_tests)})")

    joblib.dump(pipeline, "model.joblib")
    
    # Save the labels mapped to department keys
    classes_list = sorted(df["label"].unique().tolist())
    with open("label_map.json", "w") as f:
        json.dump(classes_list, f)

    print("\nSaved model.joblib and label_map.json")


if __name__ == "__main__":
    main()
