import os
from typing import List, Dict, Any
from sentence_transformers import CrossEncoder

class Reranker:
    """
    Cross-encoder re-ranking service for improving retrieval relevance.
    Uses a cross-encoder model to score query-document pairs more accurately
    than bi-encoder similarity alone.
    """
    
    def __init__(self):
        # Use a lightweight cross-encoder model
        model_name = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.model = CrossEncoder(model_name)
        self.enabled = os.getenv("ENABLE_RERANKING", "true").lower() == "true"
    
    def rerank(self, query: str, results: List[Dict[str, Any]], top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Re-rank search results using cross-encoder scoring.
        
        Args:
            query: User query string
            results: List of search results with 'text' and 'score' fields
            top_k: Number of top results to return after re-ranking
            
        Returns:
            Re-ranked list of results with updated scores
        """
        if not self.enabled or not results:
            return results[:top_k]
        
        # Prepare query-document pairs for cross-encoder
        pairs = [[query, result["text"]] for result in results]
        
        # Get cross-encoder scores
        cross_scores = self.model.predict(pairs)
        
        # Update results with cross-encoder scores
        for i, result in enumerate(results):
            result["original_score"] = result["score"]
            result["rerank_score"] = float(cross_scores[i])
            result["score"] = float(cross_scores[i])  # Replace with cross-encoder score
        
        # Sort by new scores and return top_k
        reranked = sorted(results, key=lambda x: x["score"], reverse=True)
        return reranked[:top_k]
