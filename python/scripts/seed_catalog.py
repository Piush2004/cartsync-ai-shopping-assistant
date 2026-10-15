import os
import random
import uuid
import firebase_admin
from firebase_admin import credentials, firestore

# Setup Firebase - assuming standard local emulator or project credentials
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(os.path.expanduser("~/.config/gcloud/application_default_credentials.json"))
        firebase_admin.initialize_app(cred)
    except:
        firebase_admin.initialize_app()

db = firestore.client()

BRANDS = ["Nike", "Levis", "Uniqlo", "Zara", "Adidas"]
CATEGORIES = ["Shirt", "Jeans", "Jacket", "T-shirt"]
GENDERS = ["Men", "Women", "Unisex"]
COLORS = ["Black", "White", "Blue", "Red", "Olive", "Grey", "Navy"]
SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"]
JEANS_SIZES = ["30x30", "32x30", "32x32", "34x32", "36x32"]
FIT_TYPES = ["slim", "regular", "oversized", "relaxed"]
MATERIALS = ["100% Cotton", "Polyester Blend", "Denim", "Linen", "Fleece"]

def generate_product():
    brand = random.choice(BRANDS)
    category = random.choice(CATEGORIES)
    gender = random.choice(GENDERS)
    fit = random.choice(FIT_TYPES)
    
    if category == "Jeans":
        sizes = random.sample(JEANS_SIZES, k=random.randint(2, len(JEANS_SIZES)))
    else:
        sizes = random.sample(SHIRT_SIZES, k=random.randint(2, len(SHIRT_SIZES)))
        
    pid = str(uuid.uuid4())
    
    inventory = {s: random.randint(0, 50) for s in sizes}
    
    return {
        "product_id": pid,
        "sku": f"{brand[:3].upper()}-{category[:3].upper()}-{random.randint(1000,9999)}",
        "brand": brand,
        "category": category,
        "gender": gender,
        "title": f"{brand} {fit.capitalize()} {category}",
        "description": f"A high-quality {fit} {category.lower()} by {brand}.",
        "images": [f"https://example.com/images/{pid}_1.jpg"],
        "available_colors": random.sample(COLORS, k=random.randint(1, 3)),
        "available_sizes": sizes,
        "price": round(random.uniform(19.99, 149.99), 2),
        "currency": "USD",
        "inventory": inventory,
        "tags": [category.lower(), fit, brand.lower(), "new_arrival"],
        "material": random.choice(MATERIALS),
        "fit_type": fit,
        "stretch": random.choice(["none", "low", "high"]),
        "season": random.choice(["Summer", "Winter", "All Season"]),
        "occasion": random.choice(["Casual", "Sport", "Formal"]),
        "measurements": None,
        "metadata": {}
    }

def seed_catalog(num_products=150):
    batch = db.batch()
    collection = db.collection("catalog")
    
    count = 0
    for _ in range(num_products):
        prod = generate_product()
        doc_ref = collection.document(prod["product_id"])
        batch.set(doc_ref, prod)
        count += 1
        
        # Firestore batches max out at 500
        if count % 100 == 0:
            batch.commit()
            batch = db.batch()
            print(f"Committed {count} products...")
            
    if count % 100 != 0:
        batch.commit()
        
    print(f"Successfully seeded {count} products into Firestore 'catalog' collection.")

if __name__ == "__main__":
    seed_catalog(150)
