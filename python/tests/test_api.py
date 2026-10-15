import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_readiness_check():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"

def test_process_job_endpoint():
    payload = {
        "jobId": "test_job_123",
        "uid": "test_user",
        "height": 180,
        "unit": "cm",
        "frontImagePath": "users/test/front.jpg",
        "sideImagePath": "users/test/side.jpg"
    }
    
    response = client.post("/jobs/process", json=payload)
    assert response.status_code == 202
    assert response.json()["jobId"] == "test_job_123"
    assert response.json()["status"] == "Accepted"
