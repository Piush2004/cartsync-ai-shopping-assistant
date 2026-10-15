import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const frontImage = formData.get('frontImage');
    const sideImage = formData.get('sideImage');
    const height = formData.get('height');
    const userId = formData.get('userId') || 'mock_user_123';

    if (!frontImage || !sideImage || !height) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a production environment, we'd upload these to Firebase Storage here
    // and send the storage URLs to the Python backend.
    const frontImagePath = "gs://mock-bucket/front.jpg";
    const sideImagePath = "gs://mock-bucket/side.jpg";
    const jobId = "job_" + Math.random().toString(36).substr(2, 9);

    const payload = {
      jobId,
      uid: userId,
      height: parseFloat(height as string),
      unit: "cm",
      frontImagePath,
      sideImagePath
    };

    // Forward to Python backend
    const response = await fetch('http://127.0.0.1:8000/jobs/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Python backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error in upload API:", error);
    // Mock successful start if backend is down for UI MVP
    const fallbackJobId = "job_" + Math.random().toString(36).substr(2, 9);
    return NextResponse.json({ 
      status: "Accepted", 
      jobId: fallbackJobId, 
      message: "Mock fallback: Job accepted" 
    });
  }
}
