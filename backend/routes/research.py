from __future__ import annotations

import html
import json
import re
from typing import Any
from urllib import parse, request, error

from fastapi import APIRouter, HTTPException

from config import DEFAULT_MODEL, OLLAMA_BASE
from services import _runtime as core
from utils import log

router = APIRouter(prefix="/api/research", tags=["research"])

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"


def _fetch_text(url: str, timeout: int = 12) -> str:
    req = request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "de-DE,de;q=0.9,en;q=0.8"})
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read(2_000_000)
            content_type = resp.headers.get("content-type", "")
            charset = "utf-8"
            match = re.search(r"charset=([^;]+)", content_type, re.I)
            if match:
                charset = match.group(1).strip()
            return raw.decode(charset, errors="replace")
    except error.URLError as exc:
        raise RuntimeError(str(exc)) from exc


def _strip_tags(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _extract_duckduckgo(html_text: str, limit: int) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for block in re.findall(r"<a[^>]+class=\"result__a\"[^>]+href=\"([^\"]+)\"[^>]*>([\s\S]*?)</a>", html_text, flags=re.I):
        href, title_html = block
        href = html.unescape(href)
        parsed = parse.urlparse(href)
        qs = parse.parse_qs(parsed.query)
        if "uddg" in qs:
            href = qs["uddg"][0]
        title = _strip_tags(title_html)
        if not title or not href:
            continue
        results.append({"title": title, "url": href, "snippet": ""})
        if len(results) >= limit:
            break

    snippets = re.findall(r"<a[^>]+class=\"result__snippet\"[^>]*>([\s\S]*?)</a>|<div[^>]+class=\"result__snippet\"[^>]*>([\s\S]*?)</div>", html_text, flags=re.I)
    for idx, parts in enumerate(snippets[:len(results)]):
        snippet = _strip_tags(parts[0] or parts[1])
        if snippet:
            results[idx]["snippet"] = snippet
    return results


def _extract_bing(html_text: str, limit: int) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for li in re.findall(r"<li class=\"b_algo\"[\s\S]*?</li>", html_text, flags=re.I):
        link_match = re.search(r"<h2[^>]*>\s*<a[^>]+href=\"([^\"]+)\"[^>]*>([\s\S]*?)</a>", li, flags=re.I)
        if not link_match:
            continue
        url = html.unescape(link_match.group(1))
        title = _strip_tags(link_match.group(2))
        snippet_match = re.search(r"<p[^>]*>([\s\S]*?)</p>", li, flags=re.I)
        snippet = _strip_tags(snippet_match.group(1)) if snippet_match else ""
        if title and url:
            results.append({"title": title, "url": url, "snippet": snippet})
        if len(results) >= limit:
            break
    return results


def search_web(query: str, limit: int = 6) -> list[dict[str, str]]:
    q = query.strip()
    if not q:
        return []
    urls = [
        ("duckduckgo", f"https://html.duckduckgo.com/html/?q={parse.quote(q)}"),
        ("bing", f"https://www.bing.com/search?q={parse.quote(q)}"),
    ]
    errors: list[str] = []
    for engine, url in urls:
        try:
            body = _fetch_text(url)
            results = _extract_duckduckgo(body, limit) if engine == "duckduckgo" else _extract_bing(body, limit)
            if results:
                return results[:limit]
        except Exception as exc:
            errors.append(f"{engine}: {exc}")
            continue
    log("WARN", "research search failed", query=q, errors=errors)
    return []


def _llm_summary(query: str, results: list[dict[str, str]]) -> str:
    if not results:
        return "Ich habe keine belastbaren Web Ergebnisse gefunden."
    source_text = "\n".join(
        f"[{idx+1}] {item.get('title','')}\nURL: {item.get('url','')}\nAuszug: {item.get('snippet','')}"
        for idx, item in enumerate(results)
    )
    prompt = (
        "Du bist der Research Agent von JARVIS. Fasse die folgenden Web Treffer auf Deutsch zusammen. "
        "Nenne Unsicherheiten klar. Keine erfundenen Fakten. Gib am Ende eine kurze Quellenliste mit Nummern aus.\n\n"
        f"Fragestellung: {query}\n\nTreffer:\n{source_text}"
    )
    payload = {
        "model": DEFAULT_MODEL or "qwen3:8b",
        "messages": core.build_messages(prompt, history=[], memory_facts=[], agent="research"),
        "stream": False,
        "options": {"temperature": 0.2, "top_p": 0.9},
    }
    try:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = request.Request(
            OLLAMA_BASE.rstrip("/") + "/api/chat",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode("utf-8", errors="replace"))
        if isinstance(result.get("message"), dict):
            answer = str(result["message"].get("content") or "").strip()
            if answer:
                return answer
        return core.normalize_backend_text(result).strip() or "Research abgeschlossen, aber Ollama hat keine verwertbare Zusammenfassung geliefert."
    except Exception as exc:
        log("WARN", "research llm summary failed", error=str(exc))
        lines = ["Research Treffer gefunden, aber die LLM Zusammenfassung ist fehlgeschlagen:"]
        for idx, item in enumerate(results, 1):
            lines.append(f"{idx}. {item.get('title')}\n{item.get('url')}\n{item.get('snippet')}")
        return "\n\n".join(lines)


@router.get("/search")
def api_research_search(q: str = "", limit: int = 6) -> dict[str, Any]:
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query fehlt")
    safe_limit = max(1, min(10, limit))
    results = search_web(query, safe_limit)
    return {"ok": True, "query": query, "count": len(results), "results": results}


@router.get("/answer")
def api_research_answer(q: str = "", limit: int = 6) -> dict[str, Any]:
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query fehlt")
    safe_limit = max(1, min(10, limit))
    results = search_web(query, safe_limit)
    answer = _llm_summary(query, results)
    return {"ok": True, "query": query, "count": len(results), "results": results, "answer": answer}
