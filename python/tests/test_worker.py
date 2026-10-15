import pytest
from unittest.mock import patch, MagicMock
from workers.orchestrator import WorkerOrchestrator
from pipeline.image_handler import ImageHandler

@patch('workers.orchestrator.get_db')
@patch('pipeline.image_handler.get_bucket')
def test_worker_orchestration_mock_mode(mock_get_bucket, mock_get_db):
    # Setup mocks to return None, forcing the mock/fallback paths in orchestrator
    mock_get_db.return_value = None
    mock_get_bucket.return_value = None
    
    payload = {
        "uid": "test_uid",
        "height": 180,
        "unit": "cm",
        "frontImagePath": "mock_front",
        "sideImagePath": "mock_side"
    }
    
    # Should run successfully without throwing exceptions through the whole pipeline
    # Since DB is None, it won't actually hit firestore
    WorkerOrchestrator.process_job("job_123", payload)

@patch('pipeline.image_handler.get_bucket')
def test_image_handler_validation(mock_get_bucket, tmp_path):
    # Test fallback path where bucket is None
    mock_get_bucket.return_value = None
    path = ImageHandler.download_and_validate("some/path.jpg", "job_123", "front")
    assert "mock_front.jpg" in path

@patch('workers.orchestrator.get_db')
def test_firestore_update(mock_get_db):
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_db.collection.return_value.document.return_value = mock_doc
    mock_get_db.return_value = mock_db
    
    WorkerOrchestrator._update_stage("job_123", "depth", status="processing")
    
    mock_doc.set.assert_called_once()
    args, kwargs = mock_doc.set.call_args
    assert args[0]["processingStage"] == "depth"
    assert args[0]["status"] == "processing"
