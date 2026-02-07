# RAG Course Generation API Quick Reference

## The Issue You Were Having

The 400 Bad Request error was likely because the RAG generation endpoint requires specific field names and structure. Here are the correct formats:

## 🚀 Working RAG Generation Example

### 1. Check Available Documents
```bash
curl "http://localhost:8000/api/v1/rag/documents"
```

### 2. Start Course Generation
```bash
curl -X POST "http://localhost:8000/api/v1/rag/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 3,
    "course_title": "Your Course Title",
    "course_description": "Your course description",
    "settings": {
      "max_lessons": 8,
      "include_quizzes": true,
      "quiz_questions_per_lesson": 4,
      "lesson_duration_minutes": 25,
      "difficulty_level": "intermediate",
      "include_summaries": true,
      "generate_tags": true,
      "language": "english"
    }
  }'
```

### 3. Check Generation Status
```bash
curl "http://localhost:8000/api/v1/rag/generate/JOB_ID"
```

### 4. Get Generated Course
```bash
curl "http://localhost:8000/api/v1/courses/COURSE_ID/details"
```

## 📋 Required vs Optional Fields

### Required Fields:
- `document_id` (int) - Must be a processed document

### Optional Fields:
- `course_title` (string) - Will be auto-generated if not provided
- `course_description` (string) - Will be auto-generated if not provided
- `settings` (object) - Uses defaults if not provided

### Settings Options:
```json
{
  "max_lessons": 8,                    // 1-50 lessons
  "include_quizzes": true,             // Generate quizzes
  "quiz_questions_per_lesson": 4,      // Questions per quiz
  "lesson_duration_minutes": 25,       // Target lesson length
  "difficulty_level": "intermediate",  // beginner/intermediate/advanced
  "include_summaries": true,           // Add lesson summaries
  "generate_tags": true,               // Auto-generate tags
  "language": "english"                // Content language
}
```

## ⚠️ Common Mistakes That Cause 400 Errors

1. **Wrong endpoint**: Use `/api/v1/rag/generate` NOT `/api/v1/courses/`
2. **Document not processed**: Document must have `status: "processed"`
3. **Invalid document_id**: Must exist and belong to user
4. **Wrong field names**: Use `course_title` not `title`
5. **Invalid settings**: Check allowed values for difficulty_level, etc.

## 🔧 Debugging Steps

1. **Check if backend is running**:
   ```bash
   curl "http://localhost:8000/health" # If you have health endpoint
   ```

2. **Verify documents exist and are processed**:
   ```bash
   curl "http://localhost:8000/api/v1/rag/documents"
   ```

3. **Check Ollama is running** (for AI generation):
   ```bash
   curl "http://localhost:11434/api/version"
   ```

4. **Monitor backend logs**:
   Look for detailed error messages in your uvicorn output

## 🎯 Complete Working Example

Here's what a successful generation looks like:

```bash
# 1. List documents
curl "http://localhost:8000/api/v1/rag/documents"
# Response: {"documents": [{"id": 3, "status": "processed", ...}]}

# 2. Start generation
curl -X POST "http://localhost:8000/api/v1/rag/generate" \
  -H "Content-Type: application/json" \
  -d '{"document_id": 3, "course_title": "Test Course"}'
# Response: {"id": 10, "status": "pending", "progress_percentage": 0}

# 3. Check progress
curl "http://localhost:8000/api/v1/rag/generate/10"
# Response: {"status": "generating_content", "progress_percentage": 40}

# 4. Final result
curl "http://localhost:8000/api/v1/rag/generate/10"
# Response: {"status": "completed", "generated_course_id": 21}

# 5. Get generated course
curl "http://localhost:8000/api/v1/courses/21/details"
```

## 🛠️ Test Scripts Available

- `python3 test_rag_generation.py` - Complete test of the RAG system
- `python3 course_cli.py generate document.txt --title "Course"` - CLI tool
- `./generate-course generate document.txt --title "Course"` - Wrapper script