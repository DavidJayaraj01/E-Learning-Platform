#!/usr/bin/env python3
"""
Simple test script to verify the E-Learning Platform API is working correctly.
Tests authentication, course fetching, and role-based access.
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"

class APITester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.student_token = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login and return user data + token"""
        url = f"{BASE_URL}/auth/login"
        data = {"email": email, "password": password}
        
        async with self.session.post(url, json=data) as response:
            if response.status == 200:
                result = await response.json()
                print(f"✅ Login successful for {email} (Role: {result['user']['role']})")
                return result
            else:
                error_text = await response.text()
                print(f"❌ Login failed for {email}: {error_text}")
                raise Exception(f"Login failed: {error_text}")

    async def get_courses(self, token: str) -> list:
        """Get all courses"""
        url = f"{BASE_URL}/courses"
        headers = {"Authorization": f"Bearer {token}"}
        
        async with self.session.get(url, headers=headers) as response:
            if response.status == 200:
                courses = await response.json()
                print(f"✅ Retrieved {len(courses)} courses")
                return courses
            else:
                error_text = await response.text()
                print(f"❌ Failed to get courses: {error_text}")
                return []

    async def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Login...")
        try:
            result = await self.login("admin1@gmail.com", "admin1@gmail.com")
            self.admin_token = result['access_token']
            return True
        except Exception as e:
            print(f"❌ Admin login test failed: {e}")
            return False

    async def test_student_login(self):
        """Test student login"""
        print("\n🔐 Testing Student Login...")
        try:
            result = await self.login("test@gmail.com", "test@gmail.com")
            self.student_token = result['access_token']
            return True
        except Exception as e:
            print(f"❌ Student login test failed: {e}")
            return False

    async def test_course_access(self):
        """Test course access for both roles"""
        print("\n📚 Testing Course Access...")
        
        if self.admin_token:
            print("Testing admin course access...")
            admin_courses = await self.get_courses(self.admin_token)
            
        if self.student_token:
            print("Testing student course access...")
            student_courses = await self.get_courses(self.student_token)

    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting E-Learning Platform API Tests...")
        
        admin_ok = await self.test_admin_login()
        student_ok = await self.test_student_login()
        
        if admin_ok or student_ok:
            await self.test_course_access()
        
        print("\n✨ Test completed!")

async def main():
    async with APITester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    print("E-Learning Platform API Tester")
    print("="*50)
    asyncio.run(main())