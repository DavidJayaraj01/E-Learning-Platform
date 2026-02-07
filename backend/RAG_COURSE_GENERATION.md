# 🤖 RAG Course Generation Feature

Automatically generate complete courses from uploaded books and documents using AI.

## 📋 Overview

This feature allows users to:
1. **Upload a book** (PDF, TXT, DOCX, EPUB)
2. **Process it** (extract text, chunk, generate embeddings)
3. **Generate a course** (outline, lessons, quizzes) using LLM

## 🗄️ Database Tables

### `uploaded_documents`
Stores uploaded files and their processing status.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| user_id | Integer | FK → users.id |
| filename | String(500) | Stored filename |
| original_filename | String(500) | Original file name |
| file_path | String(1000) | Full file path |
| file_type | String(50) | pdf, txt, docx, epub |
| file_size | Integer | Size in bytes |
| status | Enum | pending, processing, processed, failed |
| title | String(500) | Extracted title |
| author | String(255) | Extracted author |
| total_pages | Integer | Page count |
| total_chunks | Integer | Number of text chunks |
| uploaded_at | Timestamp | Upload time |
| processed_at | Timestamp | Processing completion |

### `document_chunks`
Stores text chunks with vector embeddings for RAG retrieval.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| document_id | Integer | FK → uploaded_documents.id |
| chunk_index | Integer | Order in document |
| content | Text | Chunk text content |
| content_hash | String(64) | SHA256 for deduplication |
| page_number | Integer | Source page |
| chapter | String(255) | Chapter name |
| section | String(255) | Section name |
| embedding | Float[] | Vector embedding (384 dims) |
| embedding_model | String(100) | Model used |
| token_count | Integer | Approximate tokens |

### `course_generation_jobs`
Tracks course generation progress.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| document_id | Integer | FK → uploaded_documents.id |
| user_id | Integer | FK → users.id |
| status | Enum | pending, analyzing, generating_*, completed, failed |
| progress_percentage | Integer | 0-100 |
| current_step | String(255) | Current operation |
| error_message | Text | Error if failed |
| settings | JSON | Generation settings |
| generated_outline | JSON | Course outline |
| generated_lessons | JSON | Lesson content |
| generated_quizzes | JSON | Quiz data |
| generated_course_id | Integer | FK → courses.id (result) |
| created_at | Timestamp | Job creation |
| started_at | Timestamp | Processing start |
| completed_at | Timestamp | Completion time |

### `rag_configurations`
Stores RAG and LLM settings per user.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| user_id | Integer | NULL for global defaults |
| embedding_model | String(100) | Default: all-MiniLM-L6-v2 |
| chunk_size | Integer | Default: 1000 chars |
| chunk_overlap | Integer | Default: 200 chars |
| llm_provider | String(50) | ollama, openai, gemini |
| llm_model | String(100) | Default: gemma3:4b |
| temperature | Float | Default: 0.7 |
| max_tokens | Integer | Default: 2000 |
| top_k_chunks | Integer | Chunks for RAG: 5 |
| similarity_threshold | Float | Default: 0.7 |

## 🚀 API Endpoints

### Document Management

```
POST   /api/v1/rag/documents/upload         Upload a document
POST   /api/v1/rag/documents/{id}/process   Trigger processing
GET    /api/v1/rag/documents                List user's documents
GET    /api/v1/rag/documents/{id}           Get document details
GET    /api/v1/rag/documents/{id}/chunks    Get document chunks
POST   /api/v1/rag/documents/{id}/search    Search within document
DELETE /api/v1/rag/documents/{id}           Delete document
```

### Course Generation

```
POST   /api/v1/rag/generate                 Start generation
GET    /api/v1/rag/generate/jobs            List all jobs
GET    /api/v1/rag/generate/{job_id}        Get job status
DELETE /api/v1/rag/generate/{job_id}        Cancel job
```

### Configuration

```
GET    /api/v1/rag/config                   Get RAG config
POST   /api/v1/rag/config                   Create/update config
PUT    /api/v1/rag/config                   Update config
```

### Utilities

```
GET    /api/v1/rag/supported-formats        List supported file types
GET    /api/v1/rag/llm-providers            List LLM providers
```

## 📖 Workflow Example

### 1. Upload a Book

```bash
curl -X POST "http://localhost:8000/api/v1/rag/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@my_book.pdf"
```

Response:
```json
{
  "id": 1,
  "filename": "1_20260207_abc123.pdf",
  "original_filename": "my_book.pdf",
  "file_type": "pdf",
  "status": "pending"
}
```

### 2. Wait for Processing

```bash
curl "http://localhost:8000/api/v1/rag/documents/1"
```

Wait until `status` is `processed`.

### 3. Start Course Generation

```bash
curl -X POST "http://localhost:8000/api/v1/rag/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": 1,
    "settings": {
      "max_lessons": 10,
      "include_quizzes": true,
      "quiz_questions_per_lesson": 5,
      "difficulty_level": "intermediate"
    }
  }'
```

### 4. Monitor Progress

```bash
curl "http://localhost:8000/api/v1/rag/generate/1"
```

Response:
```json
{
  "id": 1,
  "status": "generating_content",
  "progress_percentage": 65,
  "current_step": "Generating lesson 6 of 10..."
}
```

### 5. Access Generated Course

When `status` is `completed`, use `generated_course_id`:

```bash
curl "http://localhost:8000/api/v1/courses/5"
```

## ⚙️ Configuration

### Environment Variables

```bash
# LLM Providers (optional - defaults to Ollama)
OPENAI_API_KEY=sk-...              # For OpenAI
GOOGLE_API_KEY=...                  # For Gemini
```

### Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| embedding_model | all-MiniLM-L6-v2 | Sentence transformer model |
| chunk_size | 1000 | Characters per chunk |
| chunk_overlap | 200 | Overlap between chunks |
| llm_provider | ollama | LLM provider |
| llm_model | gemma3:4b | LLM model name (Gemma 3 4B) |
| max_lessons | 10 | Max lessons per course |

## 🛠️ Setup

### 1. Install Dependencies

```bash
pip install PyPDF2 sentence-transformers httpx numpy python-docx
```

### 2. Run Database Migration

```bash
alembic upgrade head
```

### 3. Start Ollama (for local LLM)

```bash
ollama pull gemma3:4b
ollama serve
```

### 4. Create Upload Directory

```bash
mkdir -p uploads/documents
```

## 📚 Supported Formats

| Format | Extension | Library |
|--------|-----------|---------|
| PDF | .pdf | PyPDF2 |
| Text | .txt, .md | Built-in |
| Word | .docx | python-docx |
| EPUB | .epub | ebooklib (optional) |

## 🔧 Technical Details

### Embedding Model
- **Model**: `all-MiniLM-L6-v2` from SentenceTransformers
- **Dimensions**: 384
- **Storage**: PostgreSQL ARRAY(Float)

### Text Chunking
- **Strategy**: Sentence-boundary aware
- **Default Size**: 1000 characters
- **Overlap**: 200 characters

### LLM Providers

| Provider | Model | Local/Remote |
|----------|-------|--------------|
| Ollama | **gemma3:4b** (default), llama3, mistral | Local |
| OpenAI | gpt-4, gpt-3.5-turbo | Remote |
| Gemini | gemini-pro, gemini-2.0-flash | Remote |
