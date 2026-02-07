#!/usr/bin/env python3
"""
Real-time Update Test Script
Tests if course content updates from admin are immediately visible to students
"""

import asyncio
import aiohttp
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

async def test_real_time_updates():
    """Test real-time course content updates"""
    
    print("🧪 Testing Real-time Course Content Updates")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        
        # Step 1: Login as admin
        print("🔐 Step 1: Admin Login...")
        admin_login = await session.post(f"{BASE_URL}/auth/login", json={
            "email": "admin1@gmail.com",
            "password": "admin1@gmail.com"
        })
        
        if admin_login.status == 200:
            admin_data = await admin_login.json()
            admin_token = admin_data['access_token']
            print("✅ Admin login successful")
        else:
            print("❌ Admin login failed")
            return

        # Step 2: Login as student  
        print("\n🔐 Step 2: Student Login...")
        student_login = await session.post(f"{BASE_URL}/auth/login", json={
            "email": "test@gmail.com", 
            "password": "test@gmail.com"
        })
        
        if student_login.status == 200:
            student_data = await student_login.json()
            student_token = student_data['access_token']
            print("✅ Student login successful")
        else:
            print("❌ Student login failed")
            return

        # Step 3: Get published courses as student (before update)
        print("\n📚 Step 3: Getting published courses as student...")
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        courses_response = await session.get(f"{BASE_URL}/courses", headers=student_headers)
        if courses_response.status == 200:
            courses_before = await courses_response.json()
            print(f"✅ Found {len(courses_before)} published courses")
            
            if courses_before:
                test_course = courses_before[0]
                course_id = test_course['id']
                original_title = test_course['title']
                print(f"📖 Test course: {original_title} (ID: {course_id})")
                
                # Step 4: Update course as admin
                print(f"\n✏️ Step 4: Updating course as admin...")
                timestamp = datetime.now().strftime("%H:%M:%S")
                new_title = f"{original_title} - Updated at {timestamp}"
                
                admin_headers = {"Authorization": f"Bearer {admin_token}"}
                update_response = await session.put(
                    f"{BASE_URL}/courses/{course_id}",
                    headers=admin_headers,
                    json={"title": new_title}
                )
                
                if update_response.status == 200:
                    print("✅ Course updated successfully")
                    
                    # Step 5: Check if student sees the update
                    print("\n🔄 Step 5: Checking if student sees the update...")
                    await asyncio.sleep(1)  # Small delay
                    
                    updated_courses_response = await session.get(f"{BASE_URL}/courses", headers=student_headers)
                    if updated_courses_response.status == 200:
                        courses_after = await updated_courses_response.json()
                        updated_course = next((c for c in courses_after if c['id'] == course_id), None)
                        
                        if updated_course and updated_course['title'] == new_title:
                            print("🎉 SUCCESS: Student can see the updated course title immediately!")
                            print(f"   Before: {original_title}")
                            print(f"   After:  {updated_course['title']}")
                        else:
                            print("❌ FAILED: Student cannot see the updated course title")
                    
                    # Revert the title back
                    print(f"\n🔄 Reverting course title...")
                    await session.put(
                        f"{BASE_URL}/courses/{course_id}",
                        headers=admin_headers,
                        json={"title": original_title}
                    )
                    print("✅ Course title reverted")
                    
                else:
                    print("❌ Course update failed")
            else:
                print("❌ No courses found to test with")
        else:
            print("❌ Failed to get courses")

if __name__ == "__main__":
    asyncio.run(test_real_time_updates())