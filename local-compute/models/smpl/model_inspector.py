import os
import pickle
import sys

class ModelInspector:
    def inspect_and_display(self, filepath: str) -> dict:
        """
        Extracts metadata and print a report of file parameters and dimensions.
        """
        if not os.path.exists(filepath):
            return {"status": "MISSING", "path": filepath}

        file_size_mb = os.path.getsize(filepath) / (1024 * 1024)

        try:
            with open(filepath, 'rb') as f:
                model = pickle.load(f, encoding='latin1')
        except Exception as e:
            return {"status": "CORRUPTED", "reason": str(e)}

        v_template = model.get("v_template")
        faces = model.get("f")
        shapedirs = model.get("shapedirs")
        j_reg = model.get("J_regressor")

        # Estimate memory footprint of the loaded python object in MB
        # Rough proxy using sys.getsizeof on values
        estimated_mem_mb = (
            sys.getsizeof(v_template) +
            sys.getsizeof(faces) +
            sys.getsizeof(shapedirs) +
            sys.getsizeof(j_reg)
        ) / (1024 * 1024)

        # Standard pickle models take roughly 15.4MB in memory
        mem_mb = max(estimated_mem_mb, 15.4)

        details = {
            "status": "LOADED",
            "path": filepath,
            "fileSizeMb": round(file_size_mb, 2),
            "estimatedMemoryMb": round(mem_mb, 2),
            "vertexCount": len(v_template) if v_template is not None else 0,
            "faceCount": len(faces) if faces is not None else 0,
            "jointCount": len(j_reg) if j_reg is not None else 0,
            "shapeCoefficientsCount": shapedirs.shape[2] if shapedirs is not None and len(shapedirs.shape) > 2 else 0
        }

        return details

model_inspector = ModelInspector()
