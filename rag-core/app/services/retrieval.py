import os
from typing import List, Optional
import asyncio
from langchain_huggingface import HuggingFaceEmbeddings
from upstash_vector import Index
from app.services.query_expander import QueryExpander
from app.services.reranker import Reranker

class RetrievalService:
    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Validate Upstash credentials
        upstash_url = os.getenv("UPSTASH_VECTOR_REST_URL")
        upstash_token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
        
        if not upstash_url or not upstash_token:
            raise ValueError("UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set in .env file")
        
        # Initialize Upstash Vector
        self.index = Index(
            url=upstash_url,
            token=upstash_token
        )
        
        # Initialize same Embedding Model (Local - No API Key Required)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize query expander and reranker
        self.query_expander = QueryExpander()
        self.reranker = Reranker()
        
        self.enable_expansion = os.getenv("ENABLE_QUERY_EXPANSION", "true").lower() == "true"

    def generate_embeddings(self, texts: List[str]):
        return self.embeddings.embed_documents(texts)

    async def search(self, query: str, top_k: int = 10, namespace: str = None):
        if not namespace:
            print("ERROR: Namespace is required for search", flush=True)
            return []
            
        print(f"DEBUG: Searching for '{query}' in {namespace}", flush=True)
        try:
            # Step 1: Expand query if enabled
            if self.enable_expansion:
                query_variations = self.query_expander.expand_query(query)
                print(f"DEBUG: Expanded query to {len(query_variations)} variations", flush=True)
            else:
                query_variations = [query]
            
            # Step 2: Retrieve results for all query variations
            local_results = []
            seen_texts = set()  # For deduplication
            
            loop = asyncio.get_running_loop()
            
            for query_var in query_variations:
                # Generate embedding for this variation
                query_vector = await loop.run_in_executor(None, self.embeddings.embed_query, query_var)
                
                # Search Upstash
                # Use metadata filtering for namespace
                try:
                    search_result = await loop.run_in_executor(
                        None,
                        lambda: self.index.query(
                            vector=query_vector,
                            top_k=top_k * 2,
                            include_metadata=True,
                            filter=f"namespace = '{namespace}'"
                        )
                    )
                except Exception as e:
                    print(f"ERROR: Upstash query failed: {e}", flush=True)
                    continue

                # Add results, avoiding duplicates
                for res in search_result:
                    text = res.metadata.get("text")
                    if text and text not in seen_texts:
                        seen_texts.add(text)
                        local_results.append({
                            "text": text,
                            "score": res.score,
                            "metadata": res.metadata.get("metadata"),
                            "url": res.metadata.get("url"),
                            "source_type": "local"
                        })
            
            all_results = local_results
            print(f"DEBUG: Retrieved {len(local_results)} local results", flush=True)
            
            # Step 3: Re-rank results using cross-encoder
            reranked_results = self.reranker.rerank(query, all_results, top_k)
            
            print(f"DEBUG: Returning {len(reranked_results)} re-ranked results", flush=True)
            return reranked_results
            
        except Exception as e:
            print(f"ERROR: Search failed: {e}")
            raise e
