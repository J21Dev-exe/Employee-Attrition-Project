from pathlib import Path
import json

import joblib
import pandas as pd
from flask import Flask, render_template, request

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

# Load Model
model = joblib.load("../model/xgboost_model.pkl")

# Load defaults
with open("../notebook/defaults.json", "r", encoding="utf-8") as f:
    defaults = json.load(f)

ALL_DEFAULTS = defaults

# Load defaults
feature_names = joblib.load("../model/feature_names.pkl")

# Load threshold
with open("../model/threshold.json", "r") as f:
    threshold_config = json.load(f)

THRESHOLD = threshold_config["threshold"]


# ---------- HOME PAGE ----------

@app.route("/")
def home():
    return render_template("index.html")


# ---------- QUICK INSIGHTS PAGE ----------

@app.route("/insights")
def insights():
    return render_template("insights.html")


# ---------- ADVANCED PAGE ----------

@app.route("/advanced")
def advanced():
    return render_template("advanced.html")


def _predict_from_frame(sample_df):
    prediction_probability = model.predict_proba(sample_df)[0]
    leave_probability = prediction_probability[1]

    prediction = 1 if leave_probability >= THRESHOLD else 0

    attrition_probability = round(leave_probability * 100, 1)

    if attrition_probability < 10:
        risk_status = "LOW RISK 🟢"
        result = "Employee is NOT likely to leave the company."

    elif attrition_probability < 25:
        risk_status = "MEDIUM RISK 🟠"
        result = "Employee shows moderate attrition risk."

    else:
        risk_status = "HIGH RISK 🔴"
        result = "Employee is likely to LEAVE the company."

    return attrition_probability, risk_status, result
    


# ---------- QUICK PREDICTION ----------

@app.route("/predict", methods=["POST"])
def predict():
    age = int(request.form["age"])
    income = int(request.form["income"])
    distance = int(request.form["distance"])
    overtime = request.form["overtime"]

    jobsatisfaction = int(request.form["jobsatisfaction"])
    worklifebalance = int(request.form["worklifebalance"])
    environmentsatisfaction = int(request.form["environmentsatisfaction"])

    quick_data = {
        "Age": age,
        "DistanceFromHome": distance,
        "EnvironmentSatisfaction": environmentsatisfaction,
        "JobInvolvement": 3,
        "JobSatisfaction": jobsatisfaction,
        "MonthlyIncome": income,
        "NumCompaniesWorked": 1,
        "PercentSalaryHike": 20,
        "RelationshipSatisfaction": 3,
        "StockOptionLevel": 1,
        "TotalWorkingYears": 5,
        "TrainingTimesLastYear": 2,
        "WorkLifeBalance": worklifebalance,
        "YearsAtCompany": 4,
        "YearsInCurrentRole": 2,
        "YearsSinceLastPromotion": 1,
        "YearsWithCurrManager": 2,
        "BusinessTravel_Travel_Rarely": 1,
        "Department_Research & Development": 1,
        "JobRole_Research Scientist": 1,
        "MaritalStatus_Married": 1,
        "OverTime_Yes": 1 if str(overtime).lower() == "yes" else 0,
    }

    sample_df = pd.DataFrame([quick_data]).reindex(
        columns=feature_names,
        fill_value=0,
    )
    probability, risk_status, result = _predict_from_frame(sample_df)

    return render_template(
        "insights.html",
        prediction_result=result,
        probability=probability,
        risk_status=risk_status,
    )


# ---------- ADVANCED PREDICTION ----------

@app.route("/advanced_predict", methods=["POST"])
def advanced_predict():

    employee_data = {
        "age": request.form.get("age"),
        "distancefromhome": request.form.get("distancefromhome"),
        "environmentsatisfaction": request.form.get("environmentsatisfaction"),
        "jobinvolvement": request.form.get("jobinvolvement"),
        "jobsatisfaction": request.form.get("jobsatisfaction"),
        "monthlyincome": request.form.get("monthlyincome"),
        "numcompaniesworked": request.form.get("numcompaniesworked"),
        "percentsalaryhike": request.form.get("percentsalaryhike"),
        "relationshipsatisfaction": request.form.get("relationshipsatisfaction"),
        "stockoptionlevel": request.form.get("stockoptionlevel"),
        "totalworkingyears": request.form.get("totalworkingyears"),
        "trainingtimeslastyear": request.form.get("trainingtimeslastyear"),
        "worklifebalance": request.form.get("worklifebalance"),
        "yearsatcompany": request.form.get("yearsatcompany"),
        "yearsincurrentrole": request.form.get("yearsincurrentrole"),
        "yearssincelastpromotion": request.form.get("yearssincelastpromotion"),
        "yearswithcurrentmanager": request.form.get("yearswithcurrentmanager"),
        "overtime": request.form.get("overtime"),
    }

    # Fill missing/unselected values from defaults
    for key, default_value in ALL_DEFAULTS.items():

        if employee_data.get(key) in [None, ""]:

            employee_data[key] = default_value

    sample_dict = {
        "Age": int(employee_data["age"]),
        "DistanceFromHome": int(employee_data["distancefromhome"]),
        "EnvironmentSatisfaction": int(employee_data["environmentsatisfaction"]),
        "JobInvolvement": int(employee_data["jobinvolvement"]),
        "JobSatisfaction": int(employee_data["jobsatisfaction"]),
        "MonthlyIncome": int(employee_data["monthlyincome"]),
        "NumCompaniesWorked": int(employee_data["numcompaniesworked"]),
        "PercentSalaryHike": int(employee_data["percentsalaryhike"]),
        "RelationshipSatisfaction": int(employee_data["relationshipsatisfaction"]),
        "StockOptionLevel": int(employee_data["stockoptionlevel"]),
        "TotalWorkingYears": int(employee_data["totalworkingyears"]),
        "TrainingTimesLastYear": int(employee_data["trainingtimeslastyear"]),
        "WorkLifeBalance": int(employee_data["worklifebalance"]),
        "YearsAtCompany": int(employee_data["yearsatcompany"]),
        "YearsInCurrentRole": int(employee_data["yearsincurrentrole"]),
        "YearsSinceLastPromotion": int(employee_data["yearssincelastpromotion"]),
        "YearsWithCurrManager": int(employee_data["yearswithcurrentmanager"]),
        "OverTime_Yes": 1 if str(employee_data["overtime"]).lower() == "yes" else 0,
        "BusinessTravel_Travel_Rarely": 1,
        "Department_Research & Development": 1,
        "JobRole_Research Scientist": 1,
        "MaritalStatus_Married": 1,
    }

    sample_df = pd.DataFrame([sample_dict]).reindex(
        columns=feature_names,
        fill_value=0,
    )

    probability, risk_status, result = _predict_from_frame(sample_df)

    return render_template(
        "advanced.html",
        prediction_result=result,
        probability=probability,
        confidence=probability,
        risk_status=risk_status,
    )


if __name__ == "__main__":
    app.run(debug=True)
