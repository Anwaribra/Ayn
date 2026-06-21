import asyncio
import logging

logger = logging.getLogger(__name__)

async def perform_web_search(query: str) -> str:
    try:
        from duckduckgo_search import DDGS
        def search():
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=4))
                if not results:
                    return "No recent web search results found."
                formatted = "Recent Web Search Results (Use this to answer the user):\n\n"
                for r in results:
                    formatted += f"Source: {r.get('title')}\nDetails: {r.get('body')}\n\n"
                return formatted
        return await asyncio.to_thread(search)
    except ImportError:
        logger.warning("duckduckgo_search not installed.")
        return ""
    except Exception as e:
        logger.warning(f"DDG search failed: {e}")
        return ""
