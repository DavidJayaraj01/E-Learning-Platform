"""
Document Processing Service

Handles:
- Document upload and storage
- PDF/text extraction
- Text chunking for RAG
- Embedding generation
"""

import os
import hashlib
import asyncio
from typing import List, Optional, Tuple
from datetime import datetime
import logging

# Document processing libraries
try:
    import PyPDF2
    from PyPDF2 import PdfReader
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func

from app.models.rag_models import UploadedDocument, DocumentChunk, RAGConfiguration

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "documents")
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'docx', 'epub', 'md'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =============================================================================
# DOCUMENT PROCESSING SERVICE
# =============================================================================

class DocumentProcessingService:
    """Service for processing uploaded documents for RAG"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_model = None
        self._model_loaded = False
    
    async def _load_embedding_model(self, model_name: str = 'all-MiniLM-L6-v2'):
        """Load the embedding model (lazy loading)"""
        if not self._model_loaded and HAS_SENTENCE_TRANSFORMERS:
            try:
                self.embedding_model = SentenceTransformer(model_name)
                self._model_loaded = True
                logger.info(f"Loaded embedding model: {model_name}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise
    
    async def save_uploaded_file(
        self, 
        file_content: bytes, 
        filename: str, 
        user_id: int
    ) -> UploadedDocument:
        """
        Save an uploaded file and create database record.
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            user_id: ID of the uploading user
            
        Returns:
            UploadedDocument record
        """
        # Validate file extension
        ext = filename.rsplit('.', 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"File type '{ext}' not allowed. Allowed types: {ALLOWED_EXTENSIONS}")
        
        # Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum of {MAX_FILE_SIZE / 1024 / 1024} MB")
        
        # Generate unique filename
        file_hash = hashlib.md5(file_content).hexdigest()[:12]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{user_id}_{timestamp}_{file_hash}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Save file to disk
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Create database record
        doc = UploadedDocument(
            user_id=user_id,
            filename=safe_filename,
            original_filename=filename,
            file_path=file_path,
            file_type=ext,
            file_size=len(file_content),
            status='pending'
        )
        
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        
        logger.info(f"Saved document: {filename} (ID: {doc.id}) for user {user_id}")
        return doc
    
    async def process_document(self, document_id: int) -> UploadedDocument:
        """
        Process an uploaded document: extract text, chunk, and generate embeddings.
        
        Args:
            document_id: ID of the document to process
            
        Returns:
            Updated UploadedDocument record
        """
        # Get document
        result = await self.db.execute(
            select(UploadedDocument).where(UploadedDocument.id == document_id)
        )
        doc = result.scalars().first()
        
        if not doc:
            raise ValueError(f"Document {document_id} not found")
        
        try:
            # Update status
            doc.status = 'processing'
            await self.db.commit()
            
            # Extract text based on file type
            if doc.file_type == 'pdf':
                text, metadata = await self._extract_pdf(doc.file_path)
            elif doc.file_type == 'txt':
                text, metadata = await self._extract_txt(doc.file_path)
            elif doc.file_type == 'md':
                text, metadata = await self._extract_txt(doc.file_path)
            else:
                raise ValueError(f"Unsupported file type: {doc.file_type}")
            
            # Update document metadata
            doc.title = metadata.get('title', doc.original_filename)
            doc.author = metadata.get('author')
            doc.total_pages = metadata.get('pages', 1)
            
            # Get RAG configuration
            config = await self._get_rag_config(doc.user_id)
            
            # Chunk the text
            chunks = self._chunk_text(
                text, 
                chunk_size=config.chunk_size if config else 1000,
                overlap=config.chunk_overlap if config else 200
            )
            
            # Load embedding model
            model_name = config.embedding_model if config else 'all-MiniLM-L6-v2'
            await self._load_embedding_model(model_name)
            
            # Generate embeddings and save chunks
            for i, chunk_text in enumerate(chunks):
                embedding = await self._generate_embedding(chunk_text)
                
                chunk = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk_text,
                    content_hash=hashlib.sha256(chunk_text.encode()).hexdigest(),
                    embedding=embedding,
                    embedding_model=model_name,
                    token_count=len(chunk_text.split())  # Rough token count
                )
                self.db.add(chunk)
            
            # Update document status
            doc.total_chunks = len(chunks)
            doc.status = 'processed'
            doc.processed_at = func.current_timestamp()
            
            await self.db.commit()
            await self.db.refresh(doc)
            
            logger.info(f"Processed document {document_id}: {len(chunks)} chunks created")
            return doc
            
        except Exception as e:
            doc.status = 'failed'
            doc.error_message = str(e)
            await self.db.commit()
            logger.error(f"Failed to process document {document_id}: {e}")
            raise
    
    async def _extract_pdf(self, file_path: str) -> Tuple[str, dict]:
        """Extract text from PDF file"""
        if not HAS_PYPDF2:
            raise ImportError("PyPDF2 is required for PDF processing. Install with: pip install PyPDF2")
        
        text_parts = []
        metadata = {}
        
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            
            # Extract metadata
            if reader.metadata:
                metadata['title'] = reader.metadata.get('/Title', '')
                metadata['author'] = reader.metadata.get('/Author', '')
            
            metadata['pages'] = len(reader.pages)
            
            # Extract text from each page
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"[Page {page_num + 1}]\n{page_text}")
        
        return "\n\n".join(text_parts), metadata
    
    async def _extract_txt(self, file_path: str) -> Tuple[str, dict]:
        """Extract text from plain text file"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        
        # Try to extract title from first line
        lines = text.split('\n')
        title = lines[0].strip()[:100] if lines else ''
        
        return text, {'title': title, 'pages': 1}
    
    def _chunk_text(
        self, 
        text: str, 
        chunk_size: int = 1000, 
        overlap: int = 200
    ) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: The text to chunk
            chunk_size: Maximum characters per chunk
            overlap: Number of overlapping characters between chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            # Calculate end position
            end = start + chunk_size
            
            # If not at the end, try to break at sentence boundary
            if end < text_length:
                # Look for sentence endings
                for boundary in ['. ', '.\n', '! ', '!\n', '? ', '?\n', '\n\n']:
                    boundary_pos = text.rfind(boundary, start + chunk_size // 2, end)
                    if boundary_pos != -1:
                        end = boundary_pos + len(boundary)
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - overlap
            
            # Prevent infinite loop
            if start >= text_length - overlap:
                break
        
        return chunks
    
    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector for text"""
        if not self.embedding_model:
            logger.warning("Embedding model not loaded, skipping embedding generation")
            return None
        
        try:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    async def _get_rag_config(self, user_id: int) -> Optional[RAGConfiguration]:
        """Get RAG configuration for user (or global if none exists)"""
        # Try user-specific config first
        result = await self.db.execute(
            select(RAGConfiguration).where(RAGConfiguration.user_id == user_id)
        )
        config = result.scalars().first()
        
        if config:
            return config
        
        # Fall back to global config
        result = await self.db.execute(
            select(RAGConfiguration).where(RAGConfiguration.user_id == None)
        )
        return result.scalars().first()
    
    async def get_document_chunks(
        self, 
        document_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DocumentChunk]:
        """Get chunks for a document"""
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def search_document(
        self, 
        document_id: int, 
        query: str, 
        top_k: int = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Search for relevant chunks in a document using semantic similarity.
        
        Args:
            document_id: Document to search in
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of (chunk, similarity_score) tuples
        """
        # Generate query embedding
        await self._load_embedding_model()
        query_embedding = await self._generate_embedding(query)
        
        if not query_embedding:
            raise ValueError("Failed to generate query embedding")
        
        # Get all chunks with embeddings
        result = await self.db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .where(DocumentChunk.embedding != None)
        )
        chunks = result.scalars().all()
        
        # Calculate similarities
        import numpy as np
        query_vec = np.array(query_embedding)
        
        similarities = []
        for chunk in chunks:
            if chunk.embedding:
                chunk_vec = np.array(chunk.embedding)
                # Cosine similarity
                similarity = np.dot(query_vec, chunk_vec) / (
                    np.linalg.norm(query_vec) * np.linalg.norm(chunk_vec)
                )
                similarities.append((chunk, float(similarity)))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    async def delete_document(self, document_id: int, user_id: int) -> bool:
        """Delete a document and its chunks"""
        result = await self.db.execute(
            select(UploadedDocument)
            .where(UploadedDocument.id == document_id)
            .where(UploadedDocument.user_id == user_id)
        )
        doc = result.scalars().first()
        
        if not doc:
            return False
        
        # Delete file from disk
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        
        # Delete database record (chunks will be cascade deleted)
        await self.db.delete(doc)
        await self.db.commit()
        
        return True
