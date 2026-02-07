#!/usr/bin/env python3
"""
Simple test script for RAG course generation

This shows how to properly use the RAG generation API endpoints.
"""

import requests
import time
import json

API_BASE = "http://localhost:8000/api/v1"

def list_documents():
    """List all uploaded documents"""
    response = requests.get(f"{API_BASE}/rag/documents")
    if response.status_code == 200:
        data = response.json()
        docs = data.get('documents', [])
        print(f"📄 Found {len(docs)} documents:")
        for doc in docs:
            status_icon = "✅" if doc['status'] == 'processed' else "❌"
            print(f"   {status_icon} ID: {doc['id']} | Status: {doc['status']} | Name: {doc['filename']}")
        return docs
    else:
        print(f"❌ Failed to list documents: {response.text}")
        return []

def start_generation(document_id, title, description):
    """Start course generation"""
    payload = {
        "document_id": document_id,
        "course_title": title,
        "course_description": description,
        "settings": {
            "max_lessons": 5,
            "include_quizzes": True,
            "quiz_questions_per_lesson": 3,
            "difficulty_level": "intermediate",
            "lesson_duration_minutes": 20
        }
    }
    
    response = requests.post(f"{API_BASE}/rag/generate", json=payload)
    
    if response.status_code == 201:
        job = response.json()
        print(f"✅ Generation job started!")
        print(f"   Job ID: {job['id']}")
        print(f"   Status: {job['status']}")
        return job['id']
    else:
        print(f"❌ Generation failed: {response.text}")
        return None

def check_job_status(job_id):
    """Check generation job status"""
    response = requests.get(f"{API_BASE}/rag/generate/{job_id}")
    
    if response.status_code == 200:
        job = response.json()
        status_icons = {
            'pending': '⏸️',
            'analyzing': '🔍',
            'generating_content': '⏳',
            'generating_quizzes': '🧪',
            'completed': '✅',
            'failed': '❌'
        }
        
        icon = status_icons.get(job['status'], '❓')
        print(f"{icon} Job {job_id}: {job['status']} ({job['progress_percentage']}%)")
        
        if job.get('current_step'):
            print(f"   Step: {job['current_step']}")
        
        if job.get('generated_course_id'):
            print(f"   Generated Course ID: {job['generated_course_id']}")
            
        if job.get('error_message'):
            print(f"   Error: {job['error_message']}")
            
        return job['status']
    else:
        print(f"❌ Failed to get job status: {response.text}")
        return None

def wait_for_completion(job_id, max_wait=300):
    """Wait for job completion"""
    print(f"⏳ Waiting for job {job_id} to complete...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait:
        status = check_job_status(job_id)
        
        if status == 'completed':
            print(f"🎉 Job completed successfully!")
            return True
        elif status == 'failed':
            print(f"❌ Job failed!")
            return False
        
        time.sleep(5)
    
    print(f"⏰ Job timeout after {max_wait} seconds")
    return False

def get_generated_course(course_id):
    """Get details of generated course"""
    response = requests.get(f"{API_BASE}/courses/{course_id}/details")
    
    if response.status_code == 200:
        course = response.json()
        print(f"📚 Generated Course Details:")
        print(f"   Title: {course['title']}")
        print(f"   Description: {course['description']}")
        print(f"   Lessons: {course['total_lessons']}")
        print(f"   Status: {'Published' if course['published'] else 'Draft'}")
        
        if course.get('lessons'):
            print(f"   📖 Lessons:")
            for i, lesson in enumerate(course['lessons'], 1):
                print(f"      {i}. {lesson['title']}")
        
        return course
    else:
        print(f"❌ Failed to get course: {response.text}")
        return None

def main():
    print("🎓 RAG Course Generation Test")
    print("=" * 40)
    
    # 1. List available documents
    print("\n1. Listing available documents...")
    docs = list_documents()
    
    if not docs:
        print("❌ No documents found. Please upload a document first.")
        return
    
    # Find a processed document
    processed_docs = [doc for doc in docs if doc['status'] == 'processed']
    if not processed_docs:
        print("❌ No processed documents found. Please wait for processing or upload a new document.")
        return
    
    # 2. Start generation
    print(f"\n2. Starting course generation...")
    doc = processed_docs[0]  # Use first processed document
    
    job_id = start_generation(
        document_id=doc['id'],
        title=f"Test Course from {doc['filename']}",
        description="Auto-generated course for testing RAG system"
    )
    
    if not job_id:
        return
    
    # 3. Wait for completion
    print(f"\n3. Monitoring generation progress...")
    success = wait_for_completion(job_id)
    
    if success:
        # 4. Get final job status to retrieve course ID
        final_response = requests.get(f"{API_BASE}/rag/generate/{job_id}")
        if final_response.status_code == 200:
            final_job = final_response.json()
            course_id = final_job.get('generated_course_id')
            
            if course_id:
                print(f"\n4. Course generated successfully!")
                get_generated_course(course_id)
                print(f"\n🌐 Access course: http://localhost:8000/api/v1/courses/{course_id}/details")
            else:
                print("❌ No course ID found in completed job")
    else:
        print("❌ Generation failed or timed out")

if __name__ == "__main__":
    main()