from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title='MediNova ML Service')


class TriagePayload(BaseModel):
    symptoms: str


class NoShowRiskPayload(BaseModel):
    patient_id: str


@app.get('/')
def health_check():
    return {'status': 'ok', 'service': 'medinova-ml-service'}


@app.post('/predict-triage')
def predict_triage(payload: TriagePayload):
    return {
        'department': 'General Medicine',
        'doctor': 'Dr. Smith',
        'urgency': 'medium',
        'message': 'Placeholder triage prediction',
    }


@app.post('/predict-noshow-risk')
def predict_noshow_risk(payload: NoShowRiskPayload):
    return {
        'patient_id': payload.patient_id,
        'risk_score': 0.25,
        'message': 'Placeholder no-show risk prediction',
    }
