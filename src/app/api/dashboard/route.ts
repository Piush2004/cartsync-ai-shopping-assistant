import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extract user_id from query params or auth context (mocked for now)
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'mock_user_123';

  try {
    // Call the live Python FastAPI backend
    const response = await fetch(`http://127.0.0.1:8000/dashboard/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BFF Error calling Python API:", error);
    // Fallback mock data if Python backend is offline
    const mockDashboardData = {
      profile: {
        user_id: userId,
        preferences: {
          favorite_brands: ["Nike", "Levis"],
          fit_preference: "slim",
          price_range: { min: 20, max: 150 },
          favorite_colors: ["Black", "White"]
        }
      },
      measurements: {
        chest_circumference: { value: 102.5, status: "success", confidence: 0.95 },
        waist_circumference: { value: 84.0, status: "success", confidence: 0.92 },
        shoulder_width: { value: 46.2, status: "success", confidence: 0.89 },
        inseam: { value: 81.3, status: "success", confidence: 0.98 },
        sleeve_length: { value: null, status: "insufficient_quality", confidence: 0.42 }
      },
      sizeRecommendations: {
        "Nike": { recommendedSize: "M", confidence: 0.96, reason: "Perfect chest fit" },
        "Levis": { recommendedSize: "32x32", confidence: 0.92, reason: "Inseam and waist match well" }
      },
      recommendedProducts: [
        { 
          product: {
              product_id: "prod_nike_001", brand: "Nike", category: "Shirt", 
              title: "Nike Slim Running Tee", price: 45.99, fit_type: "slim",
              images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"]
          },
          recommended_size: "M", fit_score: 96, fit_category: "Excellent Match", confidence: 0.86,
          reasons: [
            "Your chest and shoulder measurements align closely with this garment's sizing. A size M should provide a comfortable fit without feeling restrictive.", 
            "The product's native slim cut matches your stated fit preference perfectly."
          ]
        },
        { 
          product: {
              product_id: "prod_levis_001", brand: "Levis", category: "Jeans", 
              title: "501 Original Fit Jeans", price: 79.50, fit_type: "regular",
              images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80"]
          },
          recommended_size: "32x32", fit_score: 88, fit_category: "Good Match", confidence: 0.91,
          reasons: [
            "Your waist and inseam pair well with a 32x32, allowing for a slight break at the shoe.", 
            "Warning: This garment is a regular fit, but you indicated a preference for slim cuts. It may feel slightly relaxed through the thigh."
          ]
        }
      ],
      recommendedOutfit: null
    };
    return NextResponse.json(mockDashboardData);
  }
}
