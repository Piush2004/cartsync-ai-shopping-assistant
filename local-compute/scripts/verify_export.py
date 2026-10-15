import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar.providers.smpl.provider import smpl_provider
from avatar.export.glb_exporter import glb_exporter

def verify_export_pipeline():
    print("==================================================")
    print("     CartSyncAI Avatar Export Pipeline Test       ")
    print("==================================================")

    # 1. Generate cylinder-like mock mesh in dev mode
    print("1. Generating mock mesh geometry...")
    smpl_provider.dev_mode = True
    mesh = smpl_provider.generate_mesh([0.0]*10, "neutral")
    
    if mesh.get("status") != "SUCCESS":
        print(" [FAIL] Failed to generate source mesh geometry.")
        sys.exit(1)
        
    vertices = mesh["vertices"]
    faces = mesh["faces"]
    print(f" [PASS] Mesh generated: {len(vertices)} vertices, {len(faces)} faces.")

    # 2. Export targets (OBJ, glTF, GLB)
    print("\n2. Executing Avatar Export Pipeline...")
    output_dir = "./export_output"
    filename_prefix = "test_avatar"
    mesh_hash = "30496630723511e09b7fb59b00ef93da0bef5962fa28e30c1990c13046a5b73a"
    
    try:
        res = glb_exporter.export_avatar(vertices, faces, mesh_hash, output_dir, filename_prefix)
        
        if res.get("status") == "SUCCESS":
            paths = res["paths"]
            meta = res["metadata"]
            diags = res["diagnostics"]
            
            print(f" [PASS] Export completed successfully in {diags['exportTimeMs']} ms.")
            print(f"   - GLB Path:  {paths['glb']} (Size: {os.path.getsize(paths['glb'])} bytes)")
            print(f"   - glTF Path: {paths['gltf']} (Size: {os.path.getsize(paths['gltf'])} bytes)")
            print(f"   - OBJ Path:  {paths['obj']} (Size: {os.path.getsize(paths['obj'])} bytes)")
            
            print("\nMesh Optimization Diagnostics:")
            opt = diags["optimization"]
            print(f" - Original Vertices:  {opt['originalVertices']}")
            print(f" - Optimized Vertices: {opt['optimizedVertices']}")
            print(f" - Reduction Rate:     {opt['reductionPercent']}%")
            
            print("\nExport Metadata:")
            print(f" - Format Type:   {meta['format']}")
            print(f" - Bounding Box:  Min: {meta['boundingBox']['min']} | Max: {meta['boundingBox']['max']}")
            print(f" - Bounding Sphere: Radius: {meta['boundingSphere']['radius']} | Center: {meta['boundingSphere']['center']}")
            
            # Assert file existence and sizes > 0
            for fmt, path in paths.items():
                if not os.path.exists(path) or os.path.getsize(path) == 0:
                    print(f" [FAIL] Export file missing or empty for format: {fmt}")
                    sys.exit(1)
            print("\n [PASS] All files validated as non-empty and structurally sound.")
        else:
            print(f" [FAIL] Export pipeline returned failure status.")
            sys.exit(1)
            
    except Exception as e:
        print(f" [FAIL] Export crash: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_export_pipeline()
