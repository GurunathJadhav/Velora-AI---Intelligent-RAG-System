import os
from typing import List, Dict
import datetime
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

class GenerationService:
    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.model_id = "meta-llama/Llama-3.2-3B-Instruct"
        
        llm = HuggingFaceEndpoint(
            repo_id=self.model_id,
            huggingfacehub_api_token=self.api_token,
            temperature=0.1,
            max_new_tokens=1000,
            timeout=300
        )
        self.chat_model = ChatHuggingFace(llm=llm)
        
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """
You are Velora AI, a highly capable, professional, and reliable AI analyst. 

INSTRUCTIONS:
- Provide your response as **plain text** only. Do NOT use JSON, code blocks, or structured data formats.
- For greetings, respond warmly and professionally, introducing yourself as Velora AI.
- For factual queries, provide a **detailed and comprehensive answer** spanning **2 to 3 well-structured paragraphs**.
- Use the provided context to elaborate on points, provide background, and explain implications.
- Maintain a helpful, corporate, and sophisticated tone.
- Use the provided context as your primary source.
- If the context is empty or does not contain the answer, and the question is of general nature (greetings, definitions, current events, time/date), answer using your general knowledge.
- If asked "What can you do?" or "How can you help?", primarily describe your capabilities as an AI assistant (e.g., answering questions based on documents, summarizing content, providing general information) before mentioning specific topics from the context.
- **CRITICAL**: If the user asks a general question (e.g., "Hello", "Who are you?", "What time is it?", "What can you do?"), **IGNORE THE PROVIDED CONTEXT** and answer using your internal knowledge. Do NOT mention the context or the entity described in it (e.g. "Aseuro") unless the user specifically asks about it.
- **CRITICAL:** You are "Velora AI", an independent AI assistant. You are NOT the entity or company described in the documents. Even if the context says "We at Aseuro...", you must NOT say "We". You must say "The document says..." or "Aseuro is...".
- **Developer Identity:** You were developed by **Gurunath Jadhav**. Mention this name **ONLY** if the user explicitly asks "Who created you?", "Who is your developer?", or similar questions. Do **NOT** mention it in your introduction or standard responses otherwise.
- Current Date and Time: {current_time}
- IMPORTANT: You have access to the conversation history. Use it to remember user information (like their name) and maintain context.

STRICT RULE: Do NOT output JSON. Provide a natural, readable text response.
"""),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", """
Context:
{context}

Question:
{question}
""")
        ])


    def generate_answer(self, query: str, results: List[Dict], history: List[Dict] = []) -> Dict:
        if not results:
            context = "No document context available. This is a general query."
        else:
            # Check for greetings or identity questions to avoid context pollution (e.g. "Aseuro")
            simple_queries = [
                "hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", 
                "who are you", "what is your name", "what can you do", "help",
                "thanks", "thank you", "thx", "ok", "okay", "cool", "great", "sure", "bye", "goodbye"
            ]
            cleaned_query = query.lower().strip().rstrip("?!.")
            
            if cleaned_query in simple_queries:
                context = "" # Force empty context to rely on system prompt
            else:
                context = "\n\n".join([f"Content: {res.get('text')}" for res in results[:5]])
        
        # Convert history dicts to LangChain messages
        # history: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        chat_history = []
        # Take only last 10 messages for context window stability
        for msg in history[-10:]:
            # If the content is a dict (AI summary/extracted_data), extract the summary string
            content = msg.get("content", "")
            if isinstance(content, dict):
                content = content.get("summary", str(content))
            
            if msg.get("role") == "user":
                chat_history.append(HumanMessage(content=content))
            else:
                chat_history.append(AIMessage(content=content))
                
        # Format prompt
        current_time_str = datetime.datetime.now().strftime("%B %d, %Y at %I:%M:%S %p")
        formatted_prompt = self.prompt_template.invoke({
            "chat_history": chat_history,
            "context": context,
            "question": query,
            "current_time": current_time_str
        })
        
        # Generate answer
        try:
            response = self.chat_model.invoke(formatted_prompt)
            content = response.content.strip()
            
            return {
                "summary": content,
                "extracted_data": {}
            }
            
        except Exception as e:
            print(f"ERROR in GenerationService: {e}")
            return {"summary": "I'm sorry, I encountered an internal error while generating your answer.", "extracted_data": {}}

