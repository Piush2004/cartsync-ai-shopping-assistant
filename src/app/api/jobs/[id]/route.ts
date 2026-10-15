import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  try {
    const response = await fetch(`http://127.0.0.1:8000/jobs/${jobId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error polling job status:", error);
    // Mock progression if backend is down
    return NextResponse.json({
      jobId,
      status: "mock_mode_active",
      stage: "completed", // "uploading", "pose", "depth", "calibration", "measurement", "recommendation", "completed"
      progress: 100
    });
  }
}
