import hashlib
import os

def calculate_sha256(filepath: str, block_size: int = 65536) -> str:
    """
    Computes the SHA-256 checksum of a file by reading it in chunks.
    Returns the hexadecimal hash string.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found for checksum verification: {filepath}")
        
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for block in iter(lambda: f.read(block_size), b''):
            sha256.update(block)
    return sha256.hexdigest()

def verify_checksum(filepath: str, expected_hash: str) -> bool:
    """
    Compares the calculated SHA-256 hash of a file against an expected hash string.
    Returns True if matched, False otherwise.
    """
    if not expected_hash:
        # If no expected hash is configured, skip checking
        return True
    try:
        calculated = calculate_sha256(filepath)
        return calculated.lower() == expected_hash.lower()
    except Exception as e:
        print(f"[Checksum] Error during hash verification: {e}")
        return False
