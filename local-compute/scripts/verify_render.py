import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar.providers.smpl.provider import smpl_provider
from avatar.render.preview_generator import avatar_preview_generator

def verify_rendering_pipeline():
    print("==================================================")
    print("     CartSyncAI Avatar Preview Service Test       ")
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
    print(f" [PASS] Mesh created: {len(vertices)} vertices, {len(faces)} faces.")

    # 2. Render front, side, and isometric previews
    views = ["front", "side", "isometric"]
    
    for view in views:
        print(f"\n2. Rendering view angle: '{view}'...")
        res = avatar_preview_generator.generate_avatar_previews(vertices, faces, view_type=view)
        
        if res.get("status") == "SUCCESS":
            previews = res["previews"]
            diags = res["diagnostics"]
            print(f" [PASS] Preview generated successfully in {diags['renderTimeMs']} ms.")
            print(f"   - Large resolution:  {previews['large'].size[0]}x{previews['large'].size[1]} px")
            print(f"   - Medium resolution: {previews['medium'].size[0]}x{previews['medium'].size[1]} px")
            print(f"   - Thumbnail size:    {previews['thumbnail'].size[0]}x{previews['thumbnail'].size[1]} px")
            
            # Save files locally under diagnostic output folders
            out_dir = "./render_output"
            os.makedirs(out_dir, exist_ok=True)
            previews["large"].save(os.path.join(out_dir, f"preview_{view}_1024.png"))
            previews["medium"].save(os.path.join(out_dir, f"preview_{view}_512.png"))
            previews["thumbnail"].save(os.path.join(out_dir, f"preview_{view}_128.png"))
            print(f"   - Saved preview assets to: {out_dir}")
        else:
            print(f" [FAIL] Failed to render view {view}: {res.get('error')}")
            sys.exit(1)

    print("\n3. Testing mesh quality rejection safeguards...")
    # Attempt to render invalid empty mesh
    fail_res = avatar_preview_generator.generate_avatar_previews([], [])
    if fail_res.get("status") == "FAILED":
        print(f" [PASS] Successfully caught empty mesh coordinates: {fail_res.get('error')}")
    else:
        print(" [FAIL] Validation loader failed to reject empty mesh parameters.")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_rendering_pipeline()
