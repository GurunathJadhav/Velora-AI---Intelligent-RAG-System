# 🚀 RAG Core - Intelligent Document Retrieval System

Welcome to the **RAG Core** project! This is a robust implementation of a Retrieval-Augmented Generation (RAG) system, designed to ingest, process, and retrieve knowledge from web pages and documents with high precision.

## 🌟 Features

*   **Smart Ingestion**: Crawls web pages and processes files (PDF, DOCX, TXT) to extract structured knowledge.
*   **Vector Search**: Powered by **Upstash Vector**, a serverless high-performance vector database.
*   **Semantic Search**: Uses HuggingFace embeddings (`all-MiniLM-L6-v2`) to understand the *meaning* behind queries, not just keywords.
*   **Query Expansion**: Automatically expands search queries to catch synonyms and related concepts.
*   **Re-ranking**: Uses a cross-encoder to strictly re-rank results for maximum relevance.
*   **Auto-Maintenance**: Automatically expires data after **24 hours** to ensure freshness and reduce storage costs.

---

## 🛠️ Technology Stack

*   **Language**: Python 3.9+
*   **Vector DB**: [Upstash Vector](https://upstash.com/docs/vector/overall/whatisvector) (Serverless)
*   **Framework**: FastAPI (implied structure)
*   **ML/AI**: LangChain, HuggingFace, Sentence Transformers
*   **Browsing**: Playwright (for reliable web scraping)

---

## 📦 Zero-to-Hero Setup

Follow these steps to get your engine running.

### 1. Requirements
Ensure you have Python installed.
```bash
python --version  # Should be 3.9 or higher
```

### 2. Environment Setup
Clone the repo and install dependencies.
```bash
# Install Python packages
pip install -r requirements.txt

# Install Playwright browsers (required for scraping)
playwright install chromium
```

### 3. Configuration (`.env`)
You need to configure your environment variables.
**Create a file named `.env`** in the root directory and add your keys (see `.env.example`).

```ini
# .env file content
UPSTASH_VECTOR_REST_URL=your_project_url
UPSTASH_VECTOR_REST_TOKEN=your_secret_token
```

> **Security Note:** Never commit your `.env` file to GitHub! The codebase has been scanned to ensure no API keys are hardcoded.

### 4. Running the System
You can check the database status or clear it using the provided scripts.

```bash
# Check database stats
python check_db.py

# Clear all vectors
python clear_vector_db.py
```

---

## ⚡ Power of Upstash Vector

This project relies on **Upstash Vector** for storing and retrieving high-dimensional data.

*   **Serverless**: No servers to manage, scales to zero.
*   **Low Latency**: Built for edge-like speed.
*   **REST API**: Simple HTTP-based interaction.

**Data Retention (TTL):**
The ingestion service is configured to automatically set a **24-hour Time-To-Live (TTL)** on all data points. This means any document ingested will be automatically cleaned up by Upstash after one day, keeping your index lightweight and relevant.

---

## 🔒 Security & Best Practices

*   **API Keys**: All credentials are loaded via `os.getenv`.
*   **Git**: `.env` is included in `.gitignore` to prevent leaks.
*   **Dependencies**: Regular scans of `requirements.txt` are recommended.

Enjoy building your RAG system! 🚀
