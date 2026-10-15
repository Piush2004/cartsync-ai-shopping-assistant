import time
import numpy as np

class MetadataGenerator:
    def generate_metadata(self, vertices: list, faces: list, 
                          mesh_hash: str, format_type: str, 
                          export_time_ms: float) -> dict:
        """
        Generates and structures export metadata summaries.
        """
        v = np.array(vertices)
        
        # Bounding box
        min_bounds = np.min(v, axis=0)
        max_bounds = np.max(v, axis=0)
        
        # Bounding sphere
        center = np.mean(v, axis=0)
        distances = np.linalg.norm(v - center, axis=1)
        radius = np.max(distances)

        return {
            "meshHash": mesh_hash,
            "vertexCount": len(vertices),
            "faceCount": len(faces),
            "boundingBox": {
                "min": [round(float(coord), 4) for coord in min_bounds],
                "max": [round(float(coord), 4) for coord in max_bounds]
            },
            "boundingSphere": {
                "center": [round(float(coord), 4) for coord in center],
                "radius": round(float(radius), 4)
            },
            "exportTimeMs": round(export_time_ms, 2),
            "format": format_type.upper(),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

metadata_generator = MetadataGenerator()
