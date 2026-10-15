import requests
import time
import random
import string
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def generate_random_email():
    return f"user_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}@example.com"

def generate_random_password():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=12))

def phase_2_auth_testing():
    print("--- Phase 2: Authentication Testing ---")
    for i in range(10):
        email = generate_random_email()
        password = generate_random_password()
        
        # Register
        res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
        assert res.status_code == 200, f"Register failed: {res.text}"
        
        # Duplicate email
        res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
        assert res.status_code == 400, f"Duplicate email should fail: {res.text}"
        
        # Login
        res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        assert res.status_code == 200, f"Login failed: {res.text}"
        token = res.json()["access_token"]
        
        # Wrong password
        res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": "wrongpassword"})
        assert res.status_code == 400 or res.status_code == 401, f"Wrong password should fail: {res.text}"
        
        # Protected route
        res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200, f"Protected route failed: {res.text}"
        
        # Invalid JWT
        res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer invalid_token"})
        assert res.status_code == 401, f"Invalid JWT should fail: {res.text}"
        
    print("Phase 2 Authentication: PASS 10/10")

def phase_3_measurement_testing():
    print("--- Phase 3: Measurement Engine Testing ---")
    for i in range(10):
        email = generate_random_email()
        password = generate_random_password()
        requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
        token = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password}).json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "source_type": "manual",
            "raw_data": {
                "chest": random.uniform(75, 130),
                "waist": random.uniform(60, 120),
                "hip": random.uniform(75, 140),
                "shoulder": random.uniform(35, 60),
                "inseam": random.uniform(65, 100)
            }
        }
        
        # Upload
        res = requests.post(f"{BASE_URL}/measurement/extract", headers=headers, json=payload)
        assert res.status_code == 200, f"Measurement upload failed: {res.text}"
        
        # Graph Verification
        res = requests.get(f"{BASE_URL}/graph/me", headers=headers)
        assert res.status_code == 200, f"Graph retrieval failed: {res.text}"
        graph = res.json()
        assert graph["effective_measurements"] is not None, "Effective measurements not created"
        
    print("Phase 3 Measurement Engine: PASS 10/10")

if __name__ == "__main__":
    try:
        phase_2_auth_testing()
        phase_3_measurement_testing()
    except Exception as e:
        print(f"TEST FAILED: {e}")
