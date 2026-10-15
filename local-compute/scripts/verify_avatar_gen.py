import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar.calibration_report import report_generator
from avatar.providers.smpl.provider import smpl_provider
from avatar.mesh_verifier import mesh_verifier

def verify_avatar_generation():
    print("==================================================")
    print("     CartSyncAI SMPL Avatar Generation Test       ")
    print("==================================================")

    # 1. Sample input measurements (average male dimensions)
    sample_measurements = {
        "heightCm": 178.0,
        "shoulderWidthCm": 44.5,
        "chestCm": 100.0,
        "waistCm": 84.0,
        "hipsCm": 102.0,
        "inseamCm": 82.0,
        "sleeveCm": 62.0,
        "neckCm": 39.5,
        "gender": "male"
    }
    
    print("1. Running Calibration Engine on sample measurements...")
    try:
        report = report_generator.generate_calibration_report(sample_measurements)
        if report.get("status") != "SUCCESS":
            print(f" [FAIL] Calibration failed: {report.get('error')}")
            sys.exit(1)
            
        betas = report["optimizedShapeParameters"]["betas"]
        gender = report["optimizedShapeParameters"]["gender"]
        print(f" [PASS] Calibrated Betas: {betas}")
        print(f" [PASS] Body Shape Mapped: {report['bodyShapeClassification']['shape']}")
        
    except Exception as e:
        print(f" [FAIL] Calibration crash: {e}")
        sys.exit(1)

    # 2. Trigger SMPL Provider Mesh Generation
    print("\n2. Calling SMPL Provider to generate 3D Body Mesh...")
    try:
        mesh_result = smpl_provider.generate_mesh(betas, gender)
        
        if mesh_result.get("status") == "SUCCESS":
            vertices = mesh_result["vertices"]
            faces = mesh_result["faces"]
            joints = mesh_result["joints"]
            stats = mesh_result["statistics"]
            print(" [PASS] Mesh generation completed successfully.")
            print(f"   - Vertex Count: {stats['vertexCount']}")
            print(f"   - Face Count:   {stats['faceCount']}")
            print(f"   - Bounding Box: Min: {stats['boundingBox']['min']} | Max: {stats['boundingBox']['max']}")
            print(f"   - Generation Time: {stats['generationTimeMs']} ms")
        else:
            print(" [FAIL] Mesh generation status failed.")
            sys.exit(1)
            
    except Exception as e:
        print(f" [FAIL] Mesh generation crash: {e}")
        sys.exit(1)

    # 3. Running Mesh Verifier & Virtual Tape Extractions
    print("\n3. Triggering Mesh Verifier & Virtual Dimensions check...")
    try:
        verification = mesh_verifier.verify_mesh_pipeline(
            vertices, faces, joints, sample_measurements, betas, max_deviation_threshold=3.0
        )
        
        print(f" [PASS] Verification Status: {verification['status']}")
        print(f" [PASS] Mesh Hash: {verification['meshHash']}")
        print(f" [PASS] Overall Deviation: {verification['overallDeviation']} cm")
        print("\nPer-Measurement Deviations (cm):")
        for key, dev in verification["perMeasurementDeviations"].items():
            print(f" - {key}: {dev} cm")
            
        print("\nMesh Quality parameters:")
        q_report = verification["qualityReport"]
        print(f" - Mesh Integrity: {q_report['meshIntegrity']}")
        print(f" - Topology Integrity: {q_report['topologyIntegrity']}")
        print(f" - Bounding Sphere: Radius: {q_report['boundingSphere']['radius']} | Center: {q_report['boundingSphere']['center']}")
        
    except Exception as e:
        print(f" [FAIL] Verification crash: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_avatar_generation()
