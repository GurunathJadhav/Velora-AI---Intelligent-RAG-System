# 🌌 Velora AI - RAG System

**Velora AI** is a cutting-edge Retrieval-Augmented Generation (RAG) system that combines a powerful Python backend with a sleek React frontend to deliver intelligent, context-aware answers from your documents and web pages.

## 🏗️ Project Structure

The project is divided into two main components:

*   **`rag-core/`**: The **Python Backend** (FastAPI). Handles ingestion, vector storage (Upstash), content retrieval, and LLM generation.
*   **`rag-frontend/`**: The **React Frontend** (Vite + TailwindCSS). Provides a modern UI for users to query the system and visualize results.

---

## 🚀 Quick Start (Local Development)

The easiest way to run the entire stack is using the provided PowerShell script.

### Prerequisites
*   **Python 3.9+** installed.
*   **Node.js & npm** installed.
*   **Upstash Vector Database** credentials (URL and Token).

### 1. Configuration
Before running, you must configure the backend.

1.  Navigate to `rag-core/`.
2.  Copy `.env.example` to `.env`.
    ```powershell
    cp rag-core/.env.example rag-core/.env
    ```
3.  Fill in your **Upstash Vector** credentials in `rag-core/.env`.
    > 🔗 **Get your database credentials here:** [Upstash Console](https://console.upstash.com/)

4.  (Optional) Fill in your **Hugging Face** token if using gated models.
    > 🔗 **Get your access token here:** [Hugging Face Settings](https://huggingface.co/settings/tokens)
    
    Here is an example `rag-core/.env` file:
    ```ini
    # 🔐 VELORA AI RAG - Environment Configuration
    
    # [Upstash Vector Database]
    # 🚀 Get your credentials from: https://console.upstash.com/
    UPSTASH_VECTOR_REST_URL=https://your-project-name.upstash.io
    UPSTASH_VECTOR_REST_TOKEN=your_super_secret_token_here
    
    # [HuggingFace] (Optional)
    # Get token: https://huggingface.co/settings/tokens
    HUGGINGFACEHUB_API_TOKEN=hf_your_token_here_optional
    
    # [Application Settings]
    ENABLE_QUERY_EXPANSION=true
    ```

### 2. Run Everything
We have a script that sets up and runs both the backend and frontend in separate windows.

```powershell
./start_local.ps1
```

This will:
1.  Install Python dependencies and start the backend on `http://localhost:8000`.
2.  Install Node.js dependencies and start the frontend on `http://localhost:5173`.

---

## 🛠️ Manual Setup

If you prefer to run components individually:

### Backend (`rag-core`)
Powering the intelligence.

```bash
cd rag-core
pip install -r requirements.txt
python run_server.py
```
*   **Docs**: See `rag-core/README.md` for deep dive details on architecture and API.
*   **Auto-Maintenance**: The database automatically expires data after **24 hours**.

### Frontend (`rag-frontend`)
The user interface.

```bash
cd rag-frontend
npm install
npm run dev
```
*   Access at: `http://localhost:5173`

---

## 🔑 Key Features

*   **⚡ Serverless Vector Search**: Built on Upstash Vector for speed and scalability.
*   **🧠 Semantic Understanding**: Uses advanced embeddings and re-ranking for accurate retrieval.
*   **🕒 Auto-Cleanup**: Smart data retention policies keep your index fresh.
*   **🎨 Modern UI**: Responsive, dark-themed interface built with TailwindCSS.

---

## 🔒 Security

*   **API Keys**: Never commit your `.env` file.
*   **Scanning**: The codebase is checked for hardcoded secrets.

Enjoy using Velora AI! 🚀
