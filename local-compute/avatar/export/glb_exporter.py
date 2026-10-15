import os
import time
import struct
import json
import numpy as np
from .mesh_optimizer import mesh_optimizer
from .metadata import metadata_generator

class GLBExporter:
    def export_obj(self, vertices: list, faces: list, filepath: str) -> str:
        """
        Exports mesh to wave-front OBJ format (for debugging).
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("# CartSyncAI OBJ Debug Export\n")
            for v in vertices:
                f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
            for face in faces:
                # Wave-front indices are 1-based
                f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")
        return filepath

    def export_gltf(self, vertices: list, faces: list, filepath: str) -> str:
        """
        Exports mesh to human-readable glTF format (accompanied by embedded data-uri).
        """
        v_arr = np.array(vertices, dtype=np.float32)
        f_arr = np.array(faces, dtype=np.uint32)

        min_bounds = v_arr.min(axis=0).tolist()
        max_bounds = v_arr.max(axis=0).tolist()

        # Construct embedded binary data-uri
        v_bin = v_arr.tobytes()
        f_bin = f_arr.tobytes()
        total_bin = v_bin + f_bin
        
        # Base64 encode
        b64_bin = base64_encode(total_bin)

        gltf_dict = self._build_gltf_json(
            len(vertices), len(faces), min_bounds, max_bounds,
            len(v_bin), len(f_bin),
            uri=f"data:application/octet-stream;base64,{b64_bin}"
        )

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(gltf_dict, f, indent=2)
        return filepath

    def export_glb(self, vertices: list, faces: list, filepath: str) -> str:
        """
        Exports mesh to self-contained GLB 2.0 binary layout format.
        """
        v_arr = np.array(vertices, dtype=np.float32)
        f_arr = np.array(faces, dtype=np.uint32)

        min_bounds = v_arr.min(axis=0).tolist()
        max_bounds = v_arr.max(axis=0).tolist()

        # 1. Prepare binary buffers
        v_bin = v_arr.tobytes()
        f_bin = f_arr.tobytes()
        bin_data = v_bin + f_bin

        # Pad binary chunk to 4-byte alignment
        bin_padding = (4 - (len(bin_data) % 4)) % 4
        bin_data += b'\x00' * bin_padding

        # 2. Build glTF JSON metadata
        gltf_dict = self._build_gltf_json(
            len(vertices), len(faces), min_bounds, max_bounds,
            len(v_bin), len(f_bin)
        )
        gltf_str = json.dumps(gltf_dict)
        gltf_bytes = gltf_str.encode('utf-8')

        # Pad JSON chunk to 4-byte alignment with spaces
        json_padding = (4 - (len(gltf_bytes) % 4)) % 4
        gltf_bytes += b' ' * json_padding

        # 3. Assemble chunks
        # Chunk 0: JSON
        chunk_json = struct.pack("<I4s", len(gltf_bytes), b"JSON") + gltf_bytes
        # Chunk 1: BIN
        chunk_bin = struct.pack("<I4s", len(bin_data), b"BIN\x00") + bin_data

        # 4. Assemble Header (12 bytes)
        total_len = 12 + len(chunk_json) + len(chunk_bin)
        header = struct.pack("<4sII", b"glTF", 2, total_len)

        # 5. Write to file
        with open(filepath, 'wb') as f:
            f.write(header)
            f.write(chunk_json)
            f.write(chunk_bin)

        return filepath

    def _build_gltf_json(self, v_count: int, f_count: int, 
                         min_bounds: list, max_bounds: list,
                         v_bytes: int, f_bytes: int, uri: str = None) -> dict:
        buffer_entry = {"byteLength": v_bytes + f_bytes}
        if uri:
            buffer_entry["uri"] = uri

        return {
            "asset": {
                "version": "2.0",
                "generator": "CartSyncAI-GLB-Exporter"
            },
            "scene": 0,
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0}],
            "meshes": [{
                "primitives": [{
                    "attributes": {"POSITION": 0},
                    "indices": 1,
                    "mode": 4
                }]
            }],
            "accessors": [
                {
                    "bufferView": 0,
                    "byteOffset": 0,
                    "componentType": 5126, # FLOAT
                    "count": v_count,
                    "type": "VEC3",
                    "max": [round(x, 4) for x in max_bounds],
                    "min": [round(x, 4) for x in min_bounds]
                },
                {
                    "bufferView": 1,
                    "byteOffset": 0,
                    "componentType": 5125, # UNSIGNED_INT
                    "count": f_count * 3,
                    "type": "SCALAR",
                    "max": [v_count - 1],
                    "min": [0]
                }
            ],
            "bufferViews": [
                {
                    "buffer": 0,
                    "byteOffset": 0,
                    "byteLength": v_bytes,
                    "target": 34962 # ARRAY_BUFFER
                },
                {
                    "buffer": 0,
                    "byteOffset": v_bytes,
                    "byteLength": f_bytes,
                    "target": 34963 # ELEMENT_ARRAY_BUFFER
                }
            ],
            "buffers": [buffer_entry]
        }

    def export_avatar(self, vertices: list, faces: list, 
                      mesh_hash: str, output_dir: str, 
                      filename_prefix: str) -> dict:
        """
        Orchestrates full mesh optimization and multiformat exporting.
        """
        start_time = time.perf_counter()
        os.makedirs(output_dir, exist_ok=True)

        # 1. Apply Optimizer
        opt_vertices, opt_faces = mesh_optimizer.optimize_mesh(vertices, faces)

        # 2. Export targets
        glb_path = os.path.join(output_dir, f"{filename_prefix}.glb")
        gltf_path = os.path.join(output_dir, f"{filename_prefix}.gltf")
        obj_path = os.path.join(output_dir, f"{filename_prefix}.obj")

        self.export_glb(opt_vertices, opt_faces, glb_path)
        self.export_gltf(opt_vertices, opt_faces, gltf_path)
        self.export_obj(opt_vertices, opt_faces, obj_path)

        export_time_ms = (time.perf_counter() - start_time) * 1000.0

        # 3. Generate metadata
        meta = metadata_generator.generate_metadata(opt_vertices, opt_faces, mesh_hash, "GLB", export_time_ms)

        # 4. Report diagnostics
        return {
            "status": "SUCCESS",
            "paths": {
                "glb": glb_path,
                "gltf": gltf_path,
                "obj": obj_path
            },
            "metadata": meta,
            "diagnostics": {
                "optimization": {
                    "originalVertices": len(vertices),
                    "optimizedVertices": len(opt_vertices),
                    "reductionPercent": round((1.0 - len(opt_vertices)/len(vertices)) * 100.0, 2)
                },
                "exportTimeMs": round(export_time_ms, 2)
            }
        }

def base64_encode(data: bytes) -> str:
    return base64_b64encode(data).decode('utf-8')

global base64_b64encode
import base64
base64_b64encode = base64.b64encode

glb_exporter = GLBExporter()
