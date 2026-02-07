"""
Quick API Test Script
Tests the main endpoints of the E-Learning Platform API
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

# Test 1: Health Check
print("\n🏥 Testing Health Check...")
response = requests.get("http://localhost:8000/health")
print_response("Health Check", response)

# Test 2: Login as existing user (or register new one)
print("\n👤 Logging in as learner...")
login_data = {
    "email": "test@example.com",
    "password": "TestPassword123!"
}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

# If login fails, try registering
if response.status_code != 200:
    print("   User doesn't exist, registering...")
    register_data = {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "name": "Test User",
        "role": "learner"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)

print_response("User Login/Registration", response)

if response.status_code in [200, 201]:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Get current user
    print("\n🔍 Getting current user info...")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_response("Current User", response)
    
    # Test 4: Create a course (will fail - learner can't create)
    print("\n📚 Creating course (should fail - learner role)...")
    course_data_test = {
        "title": "Introduction to Python",
        "description": "Learn Python programming from scratch",
        "visibility": "everyone",
        "access_type": "open",
        "is_published": True
    }
    response = requests.post(f"{BASE_URL}/courses/", json=course_data_test, headers=headers)
    print_response("Create Course (Learner)", response)

# Test 5: Login as instructor (or register new one)
print("\n👨‍🏫 Logging in as instructor...")
instructor_login_data = {
    "email": "instructor@example.com",
    "password": "InstructorPass123!"
}
response = requests.post(f"{BASE_URL}/auth/login", json=instructor_login_data)

# If login fails, try registering
if response.status_code != 200:
    print("   Instructor doesn't exist, registering...")
    instructor_data = {
        "email": "instructor@example.com",
        "password": "InstructorPass123!",
        "name": "John Instructor",
        "role": "instructor"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=instructor_data)

print_response("Instructor Login/Registration", response)

if response.status_code in [200, 201]:
    instructor_token = response.json()["access_token"]
    instructor_headers = {"Authorization": f"Bearer {instructor_token}"}
    
    # Test 6: Create a course as instructor
    print("\n📚 Creating course as instructor...")
    course_data = {
        "title": "Introduction to Python",
        "description": "Learn Python programming from scratch",
        "visibility": "everyone",
        "access_type": "open",
        "is_published": True
    }
    response = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=instructor_headers)
    print_response("Create Course (Instructor)", response)
    
    if response.status_code == 201:
        course_id = response.json()["id"]
        
        # Test 7: Get course list
        print("\n📋 Getting course list...")
        response = requests.get(f"{BASE_URL}/courses/")
        print_response("Course List", response)
        
        # Test 8: Enroll as learner
        if 'headers' in locals():
            print("\n✅ Enrolling learner in course...")
            response = requests.post(f"{BASE_URL}/courses/{course_id}/enroll", headers=headers)
            print_response("Enroll in Course", response)
            
            # Test 9: Get learner progress
            print("\n📊 Getting learner progress...")
            response = requests.get(f"{BASE_URL}/courses/{course_id}/my-progress", headers=headers)
            print_response("Learner Progress", response)

print("\n\n✨ API Testing Complete!")
print("📖 Full API documentation available at: http://localhost:8000/docs")
