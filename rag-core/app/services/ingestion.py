import os
import httpx
import asyncio
from typing import List, Optional
from bs4 import BeautifulSoup
from langchain_community.document_transformers import BeautifulSoupTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.documents import Document
from upstash_vector import Index
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader, CSVLoader
import tempfile
from playwright.async_api import async_playwright
from urllib.parse import urljoin, urlparse

class IngestionService:
    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Validate Upstash credentials
        upstash_url = os.getenv("UPSTASH_VECTOR_REST_URL")
        upstash_token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
        
        if not upstash_url or not upstash_token:
            raise ValueError("UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set in .env file")
        
        print(f"DEBUG: Upstash URL: {upstash_url[:30]}...", flush=True)
        
        # Initialize Upstash Vector
        self.index = Index(
            url=upstash_url,
            token=upstash_token
        )
        
        # Initialize Embedding Model (Local - No API Key Required)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Recursive Character Splitting Strategy
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50,
            separators=["\n\n", "\n", " ", ""]
        )

    async def ingest(self, urls: List[str], namespace: str, recursive: bool = False, max_pages: int = 10):
        print(f"DEBUG: Starting ingestion for {urls} in {namespace}, recursive={recursive}", flush=True)
        
        docs = []
        visited = set()
        queue = asyncio.Queue()
        
        for url in urls:
            await queue.put((url, 0)) # (url, depth)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            # Use multiple workers for concurrency
            num_workers = 10
            pages_crawled = 0
            lock = asyncio.Lock()

            async def worker():
                nonlocal pages_crawled
                while not queue.empty():
                    async with lock:
                        if pages_crawled >= max_pages:
                            break
                        url, depth = await queue.get()
                        if url in visited:
                            queue.task_done()
                            continue
                        visited.add(url)
                        pages_crawled += 1
                    
                    context = await browser.new_context(
                        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    )
                    page = await context.new_page()
                    try:
                        print(f"DEBUG: [Worker] Loading {url} (depth {depth})...", flush=True)
                        await page.goto(url, wait_until="networkidle", timeout=60000)
                        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                        await asyncio.sleep(1)
                        
                        html_content = await page.content()
                        structured_text = self._extract_structured_content(html_content, url)
                        
                        if len(structured_text) >= 50:
                            async with lock:
                                docs.append(Document(page_content=structured_text, metadata={"source": url}))
                            print(f"DEBUG: Extracted {len(structured_text)} chars from {url}", flush=True)
                        
                        if recursive and depth < 2:
                            links = await page.eval_on_selector_all("a[href]", "elements => elements.map(e => e.href)")
                            base_domain = urlparse(url).netloc
                            
                            for link in links:
                                parsed_link = urlparse(link)
                                if parsed_link.netloc == base_domain:
                                    clean_link = urljoin(url, parsed_link.path)
                                    async with lock:
                                        if clean_link not in visited:
                                            await queue.put((clean_link, depth + 1))
                                            
                    except Exception as e:
                        print(f"ERROR: Worker failed to fetch {url}: {e}", flush=True)
                    finally:
                        await page.close()
                        await context.close()
                        queue.task_done()

            # Start worker tasks
            workers = [asyncio.create_task(worker()) for _ in range(num_workers)]
            await asyncio.gather(*workers)
            await browser.close()
        
        if not docs:
            print("ERROR: No documents loaded.", flush=True)
            return {"error": "Failed to load any content"}

        return await self._process_and_index(docs, namespace)

    def _extract_structured_content(self, html: str, url: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        
        # 1. Clean script/style tags
        for script in soup(["script", "style", "noscript", "iframe", "svg"]):
            script.decompose()

        content_parts = []
        
        # 2. Extract Metadata (Title, Description, Keywords)
        if soup.title:
            content_parts.append(f"# Page Title: {soup.title.string.strip()}\n")
        
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            content_parts.append(f"**Description:** {meta_desc['content'].strip()}\n")
            
        meta_keywords = soup.find("meta", attrs={"name": "keywords"})
        if meta_keywords and meta_keywords.get("content"):
            content_parts.append(f"**Keywords:** {meta_keywords['content'].strip()}\n")

        # 3. Recursive text extraction
        def process_element(element):
            text_accumulator = ""
            
            if element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                header_level = int(element.name[1])
                text = element.get_text(strip=True)
                if text:
                    text_accumulator += f"\n{'#' * header_level} {text}\n"
            
            elif element.name == 'p':
                text = element.get_text(strip=True)
                if text:
                    text_accumulator += f"{text}\n"
            
            elif element.name == 'li':
                text = element.get_text(strip=True)
                if text:
                    text_accumulator += f"- {text}\n"
            
            elif element.name == 'img':
                # Preserve Image Context via Metadata (alt, title, filename)
                alt = element.get('alt', '').strip()
                title = element.get('title', '').strip()
                src = element.get('src', '').strip()
                
                img_desc = []
                if alt: img_desc.append(alt)
                if title: img_desc.append(title)
                
                # If no alt/title, try to infer from filename if it looks meaningful
                if not img_desc and src:
                    filename = src.split('/')[-1]
                    name_part = filename.rsplit('.', 1)[0]
                    # Filter generic names (icons, buttons, etc.)
                    if len(name_part) > 3 and not any(x in name_part.lower() for x in ['logo', 'icon', 'btn', 'bg', 'banner']):
                        clean_name = name_part.replace('-', ' ').replace('_', ' ').replace('%20', ' ')
                        img_desc.append(clean_name)
                
                if img_desc:
                    desc_str = " | ".join(img_desc)
                    text_accumulator += f"[Image: {desc_str}]\n"

            elif element.name == 'a':
                # Preserve link context: [Text](href)
                href = element.get('href', '')
                text = element.get_text(strip=True)
                if text and href and not href.startswith('#') and not href.startswith('javascript'):
                    text_accumulator += f" [{text}]({href}) "
                elif text:
                    text_accumulator += f" {text} "
            
            elif element.name in ['div', 'section', 'article', 'main', 'header', 'footer']:
                 # Just recurse, maybe add a newline for separation
                 pass
            
            # Recurse children if not a leaf node we already handled
            if hasattr(element, 'children'):
                for child in element.children:
                    if child.name:
                        text_accumulator += process_element(child)
                    elif isinstance(child, str):
                        cleaned_text = child.strip()
                        if cleaned_text:
                            text_accumulator += f"{cleaned_text} "
            
            return text_accumulator

        # Start traversal from body
        body_text = process_element(soup.body) if soup.body else ""
        
        # Clean up excessive newlines
        import re
        final_text = "\n".join(content_parts) + "\n" + body_text
        final_text = re.sub(r'\n{3,}', '\n\n', final_text) # Max 2 newlines
        final_text = re.sub(r' +', ' ', final_text) # Collapse spaces
        
        return final_text.strip()

    async def ingest_files(self, files: List[tuple], namespace: str):
        """
        Ingest uploaded files (PDF, docx, txt).
        files: List of (filename, file_content)
        """
        print(f"DEBUG: Starting ingestion for {len(files)} files in {namespace}", flush=True)
        all_docs = []
        
        for filename, content in files:
            print(f"DEBUG: Processing file {filename}", flush=True)
            suffix = os.path.splitext(filename)[1].lower()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(content)
                tmp_path = tmp_file.name
            
            try:
                if suffix == '.pdf':
                    loader = PyPDFLoader(tmp_path)
                    all_docs.extend(loader.load())
                elif suffix == '.docx' or suffix == '.doc':
                    loader = Docx2txtLoader(tmp_path)
                    all_docs.extend(loader.load())
                elif suffix == '.csv':
                    loader = CSVLoader(tmp_path)
                    all_docs.extend(loader.load())
                elif suffix == '.txt':
                    loader = TextLoader(tmp_path)
                    all_docs.extend(loader.load())
                else:
                    print(f"WARNING: Unsupported file type {suffix}")
            except Exception as e:
                print(f"ERROR: Failed to load file {filename}: {e}")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        
        if not all_docs:
            return {"error": "No documents could be extracted from files"}
            
        return await self._process_and_index(all_docs, namespace)

    async def _process_and_index(self, docs: List[Document], namespace: str):
        # 3. Chunking
        print("DEBUG: Chunking documents...", flush=True)
        chunks = self.text_splitter.split_documents(docs)
        print(f"DEBUG: Created {len(chunks)} chunks", flush=True)
        
        # 4. Preparing for Vector Storage
        # Upstash is serverless, no explicit collection creation needed usually for single index.
        # We will use metadata filtering for namespaces.
        
        # 5. Indexing
        print(f"DEBUG: Generating embeddings and indexing {len(chunks)} chunks in batches...", flush=True)
        vectors_to_upsert = []
        batch_size = 20  # Smaller batch size for Inference API stability
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            batch_texts = [chunk.page_content for chunk in batch]
            
            retry_count = 0
            max_retries = 3
            batch_vectors = None
            
            while retry_count < max_retries:
                try:
                    loop = asyncio.get_running_loop()
                    batch_vectors = await loop.run_in_executor(None, self.embeddings.embed_documents, batch_texts)
                    break
                except Exception as e:
                    retry_count += 1
                    wait_time = 2 ** retry_count
                    print(f"WARNING: Batch embedding failed (attempt {retry_count}/{max_retries}): {e}. Retrying in {wait_time}s...", flush=True)
                    await asyncio.sleep(wait_time)
            
            if batch_vectors:
                for j, vector in enumerate(batch_vectors):
                    chunk = batch[j]
                    source = chunk.metadata.get('source', 'unknown')
                    import uuid
                    chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.page_content + source))
                    
                    # Add namespace to metadata for filtering
                    metadata = chunk.metadata.copy()
                    metadata["text"] = chunk.page_content
                    metadata["namespace"] = namespace
                    metadata["url"] = source
                    
                    # Use dictionary format to include TTL (86400 seconds = 24 hours)
                    vectors_to_upsert.append({
                        "id": chunk_id,
                        "vector": vector,
                        "metadata": metadata,
                        "ttl": 86400  # 24-hour retention
                    })
            else:
                print(f"ERROR: Failed to embed batch starting at index {i} after {max_retries} retries.", flush=True)

        if vectors_to_upsert:
            print(f"DEBUG: Upserting {len(vectors_to_upsert)} vectors to Upstash...", flush=True)
            # Batch upsert to Upstash
            # Upstash recommends batches of ~1000, we can upsert all at once if small enough, or chunk again
            upsert_batch_size = 50
            for i in range(0, len(vectors_to_upsert), upsert_batch_size):
                batch = vectors_to_upsert[i:i + upsert_batch_size]
                try:
                    # Upstash sync client, run in executor if needed but it's fast http
                    loop = asyncio.get_running_loop()
                    await loop.run_in_executor(None, self.index.upsert, batch)
                except Exception as e:
                     print(f"ERROR: Upstash upsert failed: {e}", flush=True)
            
        return {"chunks_indexed": len(chunks)}

    async def reset_database(self):
        """
        Deletes all vectors from the index.
        """
        print("DEBUG: Resetting database...", flush=True)
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, self.index.reset)
            print("DEBUG: Database reset successfully.", flush=True)
            return True
        except Exception as e:
            print(f"ERROR: Failed to reset database: {e}", flush=True)
            return False

    def _ensure_collection(self, collection_name: str):
        # No-op for Upstash single index
        pass
