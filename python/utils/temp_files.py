import os
import shutil
import tempfile
from typing import List
from utils.logger import logger

class TemporaryFileManager:
    def __init__(self, prefix: str = "cartsyncai_"):
        self.temp_dir = tempfile.mkdtemp(prefix=prefix)
        self.registered_files: List[str] = []
        
    def register_file(self, filename: str) -> str:
        """
        Registers a filename to be stored in this temporary directory.
        Returns the absolute local path.
        """
        path = os.path.join(self.temp_dir, filename)
        self.registered_files.append(path)
        return path

    def cleanup(self) -> None:
        """
        Removes the temporary directory and all registered files.
        """
        try:
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception as e:
            logger.error("Failed to cleanup temp directory", error=str(e), path=self.temp_dir)
