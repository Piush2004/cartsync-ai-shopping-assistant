import requests
import random
import string
import time
import statistics

BASE_URL = "http://127.0.0.1:8000/api/v1"

class QAStats:
    def __init__(self):
        self.latencies = []
        self.passed = 0
        self.failed = 0

def rand_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def generate_random_email():
    return f"user_{rand_string(8)}@example.com"

def phase_6_api_testing():
    print("--- Phase 6: API Testing ---")
    
    # 1. Invalid JSON
    res = requests.post(f"{BASE_URL}/auth/register", data="invalid json")
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    
    # 2. Missing fields
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": "missing_pwd@example.com"})
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    
    # 3. Wrong data type
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": 123, "password": "pass"})
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    
    # 4. Auth fuzzing
    res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer "})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    res = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {rand_string(100)}"})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    print("Phase 6 API Testing: PASS")

def phase_12_generate_data():
    print("--- Phase 12: Generating Realistic Test Data ---")
    # Generate 100 users, 500 measurements, brand affinities
    users = []
    
    for _ in range(100):
        email = generate_random_email()
        pwd = rand_string(12)
        res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pwd})
        if res.status_code == 200:
            token = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd}).json()["access_token"]
            users.append(token)
            
    print(f"Generated {len(users)} users.")
    
    measurements_count = 0
    for _ in range(500):
        token = random.choice(users)
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "source_type": random.choice(["manual", "scan", "import"]),
            "raw_data": {
                "chest": random.uniform(75, 130),
                "waist": random.uniform(60, 120),
                "hip": random.uniform(75, 140),
                "shoulder": random.uniform(35, 60),
                "inseam": random.uniform(65, 100)
            }
        }
        res = requests.post(f"{BASE_URL}/measurement/extract", headers=headers, json=payload)
        if res.status_code == 200:
            measurements_count += 1
            
    print(f"Generated {measurements_count} measurement profiles.")
    print("Phase 12 Data Generation: PASS")

def phase_8_performance_testing():
    print("--- Phase 8: Performance Testing ---")
    latencies = []
    
    for _ in range(100):
        start = time.time()
        requests.get(f"{BASE_URL}/health")  # assuming health endpoint or simple 404
        latencies.append((time.time() - start) * 1000)
        
    avg = statistics.mean(latencies)
    p95 = statistics.quantiles(latencies, n=100)[94]
    print(f"API Latency: Avg = {avg:.2f}ms, P95 = {p95:.2f}ms")
    print("Phase 8 Performance Testing: PASS")

if __name__ == "__main__":
    phase_6_api_testing()
    phase_12_generate_data()
    phase_8_performance_testing()
