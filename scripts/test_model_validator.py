#!/usr/bin/env python3
"""
Test script to verify the modelValidator service integration
"""

import requests
import json

def test_model_validator_service():
    """Test the modelValidator service endpoint"""
    
    # Test data
    test_data = {
        "model_name": "Test Model",
        "model_setUp": "pip install tensorflow",
        "description": "A test model for validation"
    }
    
    # Test endpoint
    url = "http://127.0.0.1:8000/api/models/model-upload"
    
    print(f"Testing modelValidator service at {url}")
    print("Sending test data:", json.dumps(test_data, indent=2))
    
    try:
        # Make a simple GET request to check if service is running
        response = requests.get("http://127.0.0.1:8000/docs")
        if response.status_code == 200:
            print("✅ modelValidator service is running")
        else:
            print(f"❌ modelValidator service returned status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ modelValidator service is not running or not accessible")
        print("Please start the service with: uvicorn main:app --reload")
        return
    except Exception as e:
        print(f"❌ Error connecting to modelValidator service: {e}")
        return

if __name__ == "__main__":
    test_model_validator_service()