#!/usr/bin/env python3
"""
E-Learning Platform Course Generation CLI

A command-line interface for generating courses from documents using AI.

Usage:
    python course_cli.py generate <document_path> --title "Course Title" --description "Description"
    python course_cli.py list-courses
    python course_cli.py list-jobs
    python course_cli.py status <job_id>
    python course_cli.py publish <course_id>
"""

import argparse
import sys
import time
import json
import requests
from pathlib import Path
from typing import Optional, Dict, Any

# Configuration
API_BASE = "http://localhost:8000/api/v1"
RAG_BASE = f"{API_BASE}/rag"
COURSES_BASE = f"{API_BASE}/courses"

class CourseGenerationCLI:
    def __init__(self):
        self.session = requests.Session()
    
    def upload_document(self, document_path: str) -> Dict[str, Any]:
        """Upload a document to the system"""
        file_path = Path(document_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Document not found: {document_path}")
        
        print(f"📄 Uploading document: {file_path.name}")
        
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/plain')}
            response = self.session.post(f"{RAG_BASE}/documents/upload", files=files)
        
        if response.status_code != 200:
            raise Exception(f"Upload failed: {response.text}")
        
        doc_data = response.json()
        print(f"✅ Document uploaded - ID: {doc_data['id']}")
        return doc_data
    
    def wait_for_processing(self, document_id: int, max_wait: int = 60):
        """Wait for document processing to complete"""
        print(f"⏳ Waiting for document processing...")
        
        for i in range(max_wait):
            response = self.session.get(f"{RAG_BASE}/documents")
            if response.status_code == 200:
                docs = response.json()['documents']
                doc = next((d for d in docs if d['id'] == document_id), None)
                
                if doc and doc['status'] == 'processed':
                    print(f"✅ Document processed successfully!")
                    return True
                elif doc and doc['status'] == 'failed':
                    print(f"❌ Document processing failed")
                    return False
            
            if i % 10 == 0:
                print(f"   Still processing... ({i}s)")
            time.sleep(1)
        
        print(f"⚠️  Document processing timeout")
        return False
    
    def generate_course(self, document_id: int, title: str, description: str, 
                       max_lessons: int = 8, difficulty: str = "intermediate") -> Dict[str, Any]:
        """Start course generation"""
        print(f"🚀 Starting course generation: '{title}'")
        
        payload = {
            "document_id": document_id,
            "course_title": title,
            "course_description": description,
            "settings": {
                "max_lessons": max_lessons,
                "include_quizzes": True,
                "quiz_questions_per_lesson": 4,
                "lesson_duration_minutes": 25,
                "difficulty_level": difficulty,
                "include_summaries": True,
                "generate_tags": True,
                "language": "english"
            }
        }
        
        response = self.session.post(f"{RAG_BASE}/generate", json=payload)
        
        if response.status_code != 201:
            raise Exception(f"Generation failed: {response.text}")
        
        job_data = response.json()
        print(f"✅ Generation job started - ID: {job_data['id']}")
        return job_data
    
    def monitor_generation(self, job_id: int, show_progress: bool = True) -> Optional[int]:
        """Monitor course generation progress"""
        if show_progress:
            print(f"📊 Monitoring generation job {job_id}...")
        
        last_status = None
        last_progress = -1
        
        while True:
            response = self.session.get(f"{RAG_BASE}/generate/{job_id}")
            if response.status_code != 200:
                print(f"❌ Failed to get job status: {response.text}")
                return None
            
            job = response.json()
            status = job['status']
            progress = job['progress_percentage']
            step = job.get('current_step', '')
            
            # Show progress updates
            if show_progress and (status != last_status or progress != last_progress):
                if status == 'completed':
                    print(f"🎉 Generation completed! Course ID: {job.get('generated_course_id')}")
                    return job.get('generated_course_id')
                elif status == 'failed':
                    error = job.get('error_message', 'Unknown error')
                    print(f"❌ Generation failed: {error}")
                    return None
                else:
                    print(f"⏳ {step} ({progress}%)")
                
                last_status = status
                last_progress = progress
            
            if status in ['completed', 'failed']:
                break
            
            time.sleep(3)
        
        return job.get('generated_course_id') if status == 'completed' else None
    
    def get_job_status(self, job_id: int) -> Dict[str, Any]:
        """Get job status"""
        response = self.session.get(f"{RAG_BASE}/generate/{job_id}")
        if response.status_code != 200:
            raise Exception(f"Failed to get job status: {response.text}")
        return response.json()
    
    def list_courses(self, published_only: bool = False):
        """List all courses"""
        params = {"published_only": published_only}
        response = self.session.get(f"{COURSES_BASE}/", params=params)
        
        if response.status_code != 200:
            raise Exception(f"Failed to list courses: {response.text}")
        
        courses = response.json()
        
        if not courses:
            print("📚 No courses found")
            return
        
        print(f"📚 Courses ({len(courses)} found):")
        print("-" * 60)
        
        for course in sorted(courses, key=lambda x: x['id'], reverse=True):
            status = "📗 Published" if course['published'] else "📘 Draft"
            print(f"{status} ID: {course['id']} - {course['title']}")
            print(f"        Lessons: {course['total_lessons']} | Created: {course['created_at'][:16]}")
            if course.get('tags'):
                print(f"        Tags: {', '.join(course['tags'])}")
            print()
    
    def list_jobs(self):
        """List generation jobs"""
        response = self.session.get(f"{RAG_BASE}/generate/jobs")
        
        if response.status_code != 200:
            raise Exception(f"Failed to list jobs: {response.text}")
        
        jobs = response.json()
        
        if not jobs:
            print("🔧 No generation jobs found")
            return
        
        print(f"🔧 Generation Jobs ({len(jobs)} found):")
        print("-" * 60)
        
        for job in sorted(jobs, key=lambda x: x['id'], reverse=True):
            status_icon = {
                'completed': '✅',
                'failed': '❌',
                'generating_content': '⏳',
                'generating_quizzes': '🧪',
                'pending': '⏸️'
            }.get(job['status'], '❓')
            
            print(f"{status_icon} Job {job['id']}: {job['status']} ({job['progress_percentage']}%)")
            print(f"        Created: {job['created_at'][:16]}")
            if job.get('generated_course_id'):
                print(f"        Course: {job['generated_course_id']}")
            if job.get('error_message'):
                print(f"        Error: {job['error_message']}")
            print()
    
    def publish_course(self, course_id: int):
        """Publish a course"""
        payload = {"published": True}
        response = self.session.put(f"{COURSES_BASE}/{course_id}", json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Failed to publish course: {response.text}")
        
        print(f"📢 Course {course_id} published successfully!")
    
    def get_course_details(self, course_id: int):
        """Get course details"""
        response = self.session.get(f"{COURSES_BASE}/{course_id}/details")
        
        if response.status_code != 200:
            raise Exception(f"Failed to get course details: {response.text}")
        
        course = response.json()
        
        print(f"📚 Course Details:")
        print("-" * 40)
        print(f"Title: {course['title']}")
        print(f"Description: {course['description']}")
        print(f"Status: {'Published' if course['published'] else 'Draft'}")
        print(f"Lessons: {course['total_lessons']}")
        print(f"Quizzes: {len(course.get('quizzes', []))}")
        print(f"Tags: {', '.join(course.get('tags', []))}")
        print(f"Created: {course['created_at']}")
        
        if course.get('lessons'):
            print(f"\n📖 Lessons:")
            for i, lesson in enumerate(course['lessons'], 1):
                print(f"  {i}. {lesson['title']}")


def main():
    parser = argparse.ArgumentParser(
        description="E-Learning Platform Course Generation CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s generate document.txt --title "Python Basics" --description "Learn Python programming"
  %(prog)s list-courses
  %(prog)s list-jobs
  %(prog)s status 5
  %(prog)s publish 10
  %(prog)s details 10
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate a course from a document')
    gen_parser.add_argument('document', help='Path to the document file')
    gen_parser.add_argument('--title', required=True, help='Course title')
    gen_parser.add_argument('--description', required=True, help='Course description')
    gen_parser.add_argument('--lessons', type=int, default=8, help='Maximum number of lessons (default: 8)')
    gen_parser.add_argument('--difficulty', choices=['beginner', 'intermediate', 'advanced'], 
                           default='intermediate', help='Course difficulty (default: intermediate)')
    gen_parser.add_argument('--no-wait', action='store_true', help='Don\'t wait for completion')
    
    # List commands
    subparsers.add_parser('list-courses', help='List all courses')
    subparsers.add_parser('list-jobs', help='List generation jobs')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Check generation job status')
    status_parser.add_argument('job_id', type=int, help='Generation job ID')
    
    # Publish command
    pub_parser = subparsers.add_parser('publish', help='Publish a course')
    pub_parser.add_argument('course_id', type=int, help='Course ID to publish')
    
    # Details command
    details_parser = subparsers.add_parser('details', help='Show course details')
    details_parser.add_argument('course_id', type=int, help='Course ID')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = CourseGenerationCLI()
    
    try:
        if args.command == 'generate':
            print(f"🎓 E-Learning Course Generator")
            print(f"=" * 40)
            
            # Upload document
            doc_data = cli.upload_document(args.document)
            
            # Wait for processing
            if cli.wait_for_processing(doc_data['id']):
                # Start generation
                job_data = cli.generate_course(
                    doc_data['id'], 
                    args.title, 
                    args.description,
                    args.lessons,
                    args.difficulty
                )
                
                if not args.no_wait:
                    # Monitor progress
                    course_id = cli.monitor_generation(job_data['id'])
                    
                    if course_id:
                        print(f"\n🎉 Course generation completed!")
                        print(f"📚 Course ID: {course_id}")
                        print(f"🌐 Access: http://localhost:8000/api/v1/courses/{course_id}/details")
                        print(f"📝 To publish: python {sys.argv[0]} publish {course_id}")
                else:
                    print(f"🏃 Job {job_data['id']} started in background")
                    print(f"📊 Check status: python {sys.argv[0]} status {job_data['id']}")
        
        elif args.command == 'list-courses':
            cli.list_courses()
        
        elif args.command == 'list-jobs':
            cli.list_jobs()
        
        elif args.command == 'status':
            job = cli.get_job_status(args.job_id)
            
            status_icon = {
                'completed': '✅',
                'failed': '❌',
                'generating_content': '⏳',
                'generating_quizzes': '🧪',
                'pending': '⏸️'
            }.get(job['status'], '❓')
            
            print(f"📊 Job {args.job_id} Status:")
            print(f"{status_icon} {job['status']} ({job['progress_percentage']}%)")
            print(f"Current Step: {job.get('current_step', 'N/A')}")
            
            if job.get('generated_course_id'):
                print(f"Generated Course: {job['generated_course_id']}")
            if job.get('error_message'):
                print(f"Error: {job['error_message']}")
        
        elif args.command == 'publish':
            cli.publish_course(args.course_id)
        
        elif args.command == 'details':
            cli.get_course_details(args.course_id)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()