from typing import List, Set
import re

class QueryExpander:
    """
    Generic query expansion service that generates synonyms and related terms
    to improve retrieval recall for all types of queries.
    """
    
    def __init__(self):
        # Generic synonym mappings for common business/organizational terms
        self.synonym_map = {
            # Leadership terms
            "ceo": ["ceo", "chief executive officer", "founder", "managing director", "president", "md"],
            "cto": ["cto", "chief technology officer", "technology head", "tech lead"],
            "cfo": ["cfo", "chief financial officer", "finance head"],
            "director": ["director", "head", "leader", "manager"],
            "founder": ["founder", "co-founder", "founding member", "creator"],
            
            # Team/People terms
            "team": ["team", "people", "staff", "employees", "members", "personnel"],
            "leadership": ["leadership", "management", "executives", "leaders"],
            
            # Service/Product terms
            "services": ["services", "offerings", "solutions", "products", "capabilities"],
            "products": ["products", "solutions", "offerings", "services"],
            "solutions": ["solutions", "services", "products", "offerings"],
            
            # Company/Organization terms
            "company": ["company", "organization", "firm", "business", "enterprise"],
            "about": ["about", "overview", "introduction", "background"],
            
            # Contact/Location terms
            "contact": ["contact", "reach", "get in touch", "connect"],
            "location": ["location", "address", "office", "headquarters"],
            
            # Technology terms
            "technology": ["technology", "tech", "technologies", "technical"],
            "software": ["software", "application", "app", "program"],
            "development": ["development", "engineering", "building", "creating"],
            
            # FMG Specific mappings
            "fmg": ["fmg", "franklin madison", "franklin madison groups", "franklin madison group"],
        }
    
    def expand_query(self, query: str) -> List[str]:
        """
        Expand a query by generating variations with synonyms.
        
        Args:
            query: Original user query
            
        Returns:
            List of query variations (including original)
        """
        query_lower = query.lower()
        variations = {query}  # Use set to avoid duplicates
        
        # Extract words from query
        words = re.findall(r'\b\w+\b', query_lower)
        
        # Find matching terms and generate variations
        for word in words:
            if word in self.synonym_map:
                synonyms = self.synonym_map[word]
                # Create variations by replacing the word with each synonym
                for synonym in synonyms:
                    if synonym != word:  # Skip if it's the same word
                        # Replace word with synonym (case-insensitive)
                        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                        variation = pattern.sub(synonym, query)
                        variations.add(variation)
        
        # Limit to top 3 variations to avoid too many queries
        return list(variations)[:3]
    
    def get_expanded_terms(self, query: str) -> Set[str]:
        """
        Get all expanded terms from a query without creating full variations.
        Useful for understanding what expansions would be applied.
        
        Args:
            query: Original user query
            
        Returns:
            Set of all related terms
        """
        query_lower = query.lower()
        words = re.findall(r'\b\w+\b', query_lower)
        
        expanded_terms = set(words)
        for word in words:
            if word in self.synonym_map:
                expanded_terms.update(self.synonym_map[word])
        
        return expanded_terms
