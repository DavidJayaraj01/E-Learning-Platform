# E-Learning Platform CLI

A powerful command-line interface for generating courses from documents using AI.

## 🚀 Quick Start

```bash
# Generate a new course
python course_cli.py generate document.txt --title "Python Basics" --description "Learn Python programming"

# Or use the wrapper script
./generate-course generate document.txt --title "Python Basics" --description "Learn Python programming"
```

## 📋 Commands

### 1. Generate Course
Generate a complete course from a document:

```bash
python course_cli.py generate <document_path> --title "Course Title" --description "Description"

# Optional parameters:
--lessons 8                    # Maximum number of lessons (default: 8)
--difficulty intermediate      # Course difficulty: beginner, intermediate, advanced
--no-wait                     # Don't wait for completion, run in background
```

**Examples:**
```bash
# Generate a machine learning course
python course_cli.py generate ml_book.txt \
  --title "Machine Learning Fundamentals" \
  --description "Complete guide to ML concepts and algorithms" \
  --lessons 10 \
  --difficulty advanced

# Generate course in background
python course_cli.py generate data_science.pdf \
  --title "Data Science Essentials" \
  --description "Learn data analysis and visualization" \
  --no-wait
```

### 2. List Courses
View all courses in the system:

```bash
python course_cli.py list-courses
```

Output example:
```
📚 Courses (3 found):
------------------------------------------------------------
📗 Published ID: 20 - Machine Learning Fundamentals
        Lessons: 8 | Created: 2026-02-07 18:57
        Tags: machine-learning, ai, algorithms

📘 Draft ID: 19 - Deep Learning Basics
        Lessons: 6 | Created: 2026-02-07 18:45
        Tags: deep-learning, neural-networks
```

### 3. List Generation Jobs
Monitor all course generation jobs:

```bash
python course_cli.py list-jobs
```

Output example:
```
🔧 Generation Jobs (2 found):
------------------------------------------------------------
✅ Job 5: completed (100%)
        Created: 2026-02-07 18:57
        Course: 20

⏳ Job 6: generating_content (45%)
        Created: 2026-02-07 19:15
```

### 4. Check Job Status
Check the status of a specific generation job:

```bash
python course_cli.py status <job_id>
```

Example:
```bash
python course_cli.py status 5

📊 Job 5 Status:
✅ completed (100%)
Current Step: Course generation completed successfully
Generated Course: 20
```

### 5. Publish Course
Make a course available to students:

```bash
python course_cli.py publish <course_id>
```

Example:
```bash
python course_cli.py publish 20

📢 Course 20 published successfully!
```

### 6. Course Details
View detailed information about a course:

```bash
python course_cli.py details <course_id>
```

Example output:
```
📚 Course Details:
----------------------------------------
Title: Machine Learning Fundamentals
Description: Complete guide to ML concepts
Status: Published
Lessons: 8
Quizzes: 8
Tags: machine-learning, ai, algorithms
Created: 2026-02-07T18:57:23

📖 Lessons:
  1. Introduction to Machine Learning
  2. Supervised Learning Algorithms
  3. Unsupervised Learning Techniques
  4. Model Evaluation and Selection
  5. Feature Engineering
  6. Ensemble Methods
  7. Deep Learning Basics
  8. Advanced Topics and Future Trends
```

## 📁 Document Requirements

### Supported Formats
- `.txt` - Plain text files
- `.pdf` - PDF documents (coming soon)
- `.docx` - Word documents (coming soon)

### Document Guidelines
- **Size**: Recommended 10KB - 10MB
- **Content**: Educational material with clear structure
- **Language**: English (primary support)
- **Quality**: Well-formatted, coherent content works best

### Example Document Structure
```
# Chapter 1: Introduction
This chapter covers the basics...

## Section 1.1: Key Concepts
Important concepts include...

# Chapter 2: Advanced Topics
Building on the fundamentals...
```

## ⚙️ Configuration

The CLI uses these default settings:

```python
API_BASE = "http://localhost:8000/api/v1"
DEFAULT_LESSONS = 8
DEFAULT_DIFFICULTY = "intermediate"
DEFAULT_QUIZ_QUESTIONS = 4
DEFAULT_LESSON_DURATION = 25  # minutes
```

## 🎯 Workflow Examples

### Complete Course Creation Workflow
```bash
# 1. Generate course from document
python course_cli.py generate deep_learning.txt \
  --title "Deep Learning Mastery" \
  --description "Complete deep learning course"

# 2. Monitor progress (if needed)
python course_cli.py list-jobs

# 3. Check course details
python course_cli.py details 21

# 4. Publish when ready
python course_cli.py publish 21

# 5. Verify publication
python course_cli.py list-courses
```

### Batch Processing
```bash
# Generate multiple courses
python course_cli.py generate ai_basics.txt --title "AI Fundamentals" --description "AI basics" --no-wait
python course_cli.py generate ml_advanced.txt --title "Advanced ML" --description "Advanced concepts" --no-wait
python course_cli.py generate dl_practical.txt --title "Practical Deep Learning" --description "Hands-on DL" --no-wait

# Check all job statuses
python course_cli.py list-jobs
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Error
```bash
❌ Error: Connection refused
```
**Solution**: Ensure the backend server is running:
```bash
uvicorn app.main:main --reload
```

#### 2. File Not Found
```bash
❌ Error: Document not found: myfile.txt
```
**Solution**: Check file path and ensure file exists:
```bash
ls -la myfile.txt
```

#### 3. Generation Timeout
```bash
⚠️ Document processing timeout
```
**Solution**: Check document size and format. Large files may need manual processing.

#### 4. Invalid Course ID
```bash
❌ Error: Course not found
```
**Solution**: List courses to find valid IDs:
```bash
python course_cli.py list-courses
```

### Debug Mode
For detailed error information, you can modify the script to show full stack traces by adding `--debug` flag (custom implementation needed).

## 📊 Status Icons Reference

| Icon | Status | Description |
|------|--------|-------------|
| ✅ | Completed | Generation finished successfully |
| ❌ | Failed | Generation failed with errors |
| ⏳ | In Progress | Currently generating content |
| 🧪 | Generating Quizzes | Creating quiz questions |
| ⏸️ | Pending | Job queued, waiting to start |
| 📗 | Published | Course is live and accessible |
| 📘 | Draft | Course ready for review |

## 🌐 API Integration

The CLI integrates with these API endpoints:

- `POST /api/v1/rag/documents/upload` - Document upload
- `GET /api/v1/rag/documents` - Document list
- `POST /api/v1/rag/generate` - Start generation
- `GET /api/v1/rag/generate/{job_id}` - Job status
- `GET /api/v1/courses/` - List courses
- `GET /api/v1/courses/{id}/details` - Course details
- `PUT /api/v1/courses/{id}` - Update course

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `tail -f logs/app.log`
3. Verify API endpoints: `curl http://localhost:8000/docs`