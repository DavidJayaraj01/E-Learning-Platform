#!/bin/bash
# =============================================================================
# RAG Course Generation Setup Script
# =============================================================================

echo "🚀 Setting up RAG Course Generation..."

# Navigate to backend
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Install new dependencies
echo "📦 Installing RAG dependencies..."
pip install PyPDF2==3.0.1 python-docx==1.1.0 sentence-transformers==2.2.2 httpx>=0.25.0 numpy>=1.24.0

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/documents

# Run database migration
echo "🗄️ Running database migration..."
alembic upgrade head

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure Ollama is running with llama3 model:"
echo "   ollama pull llama3"
echo "   ollama serve"
echo ""
echo "2. Start the FastAPI server:"
echo "   uvicorn app.main:app --reload"
echo ""
echo "3. Access the API documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "4. Test the RAG workflow:"
echo "   - POST /api/v1/rag/documents/upload (upload a PDF)"
echo "   - GET /api/v1/rag/documents/{id} (check processing status)"
echo "   - POST /api/v1/rag/generate (start course generation)"
echo "   - GET /api/v1/rag/generate/{job_id} (monitor progress)"
