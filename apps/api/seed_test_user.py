import requests
import random
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def seed_test_user():
    email = "test@example.com"
    pwd = "password123"
    
    print("Registering...")
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pwd})
    
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd})
    if res.status_code != 200:
        print("Login failed!", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Uploading measurements...")
    for _ in range(5):
        payload = {
            "source_type": "manual",
            "raw_data": {
                "chest": random.uniform(95, 100),
                "waist": random.uniform(80, 85),
                "hip": random.uniform(98, 105),
                "shoulder": random.uniform(42, 46),
                "inseam": random.uniform(80, 82)
            }
        }
        requests.post(f"{BASE_URL}/measurement/extract", headers=headers, json=payload)
        time.sleep(0.5)
        
    print("Done seeding test user!")

if __name__ == "__main__":
    seed_test_user()
