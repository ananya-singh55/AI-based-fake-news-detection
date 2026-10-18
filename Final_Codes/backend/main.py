from pathlib import Path
from ipaddress import ip_address
from urllib.parse import urlparse, urljoin
import socket

import httpx
import joblib
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "models" / "fake_news_pipeline.joblib"

if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model not found at {MODEL_PATH}. Run python train.py first."
    )

model = joblib.load(MODEL_PATH)

app = FastAPI(title="Veritas Fake News Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictRequest(BaseModel):
    mode: str = Field(pattern="^(text|url)$")
    input: str = Field(min_length=1, max_length=200000)


def inspect_article_images(raw_url: str, max_images: int = 8) -> dict:
    """Extract likely editorial images; does not detect image manipulation."""
    parsed = urlparse(raw_url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return {
            "status": "unavailable",
            "note": "A valid article URL is required to inspect images.",
            "images": []
        }

    try:
        with httpx.Client(
            timeout=8.0,
            follow_redirects=False,
            trust_env=False,
            headers={"User-Agent": "VeritasNewsAnalyzer/1.0"}
        ) as client:
            response = client.get(raw_url.strip())
            response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            return {
                "status": "unavailable",
                "note": "The URL did not return an HTML article page.",
                "images": []
            }

        if len(response.content) > 2 * 1024 * 1024:
            return {
                "status": "unavailable",
                "note": "The article page exceeded the inspection size limit.",
                "images": []
            }

        soup = BeautifulSoup(response.content, "lxml")
        article = (
            soup.find("article")
            or soup.find(attrs={"itemprop": "articleBody"})
            or soup.find("main")
        )
        container = article if article else soup.body or soup

        images = []
        seen = set()

        def add_image(src, alt="", width=None, height=None, source="article_html"):
            if not src or len(images) >= max_images:
                return

            image_url = urljoin(raw_url, src.strip())
            image_parsed = urlparse(image_url)

            if image_parsed.scheme not in ("http", "https") or not image_parsed.hostname:
                return

            host = (image_parsed.hostname or "").lower()
            path = image_parsed.path.lower()
            alt_text = (alt or "").strip()[:300]
            alt_lower = alt_text.lower()

            if image_url in seen:
                return
            if any(x in host for x in ("google-analytics.com", "googletagmanager.com")):
                return
            if path.endswith(".svg") or path.endswith(".ico"):
                return
            if "1x1_spacer" in path or "tracking" in path or "pixel" in path:
                return
            if any(x in path for x in ("/icon", "logo", "avatar")):
                return
            if any(x in alt_lower for x in ("logo", "icon", "avatar", "close button")):
                return

            try:
                w = int(width) if width and str(width).isdigit() else None
                h = int(height) if height and str(height).isdigit() else None
                if w is not None and h is not None and w * h < 10000:
                    return
            except (TypeError, ValueError):
                pass

            seen.add(image_url)
            images.append({
                "url": image_url,
                "alt": alt_text,
                "width": width,
                "height": height,
                "source": source
            })

        # Prefer the publisher's declared lead image.
        for selector in (
            ('property', 'og:image'),
            ('name', 'twitter:image'),
            ('property', 'twitter:image')
        ):
            meta = soup.find("meta", attrs={selector[0]: selector[1]})
            if meta:
                add_image(
                    meta.get("content"),
                    source="publisher_metadata"
                )

        # Then look for images inside the article content.
        for img in container.find_all("img"):
            src = (
                img.get("src")
                or img.get("data-src")
                or img.get("data-original")
                or img.get("data-lazy-src")
            )
            add_image(
                src,
                img.get("alt", ""),
                img.get("width"),
                img.get("height")
            )
            if len(images) >= max_images:
                break

        return {
            "status": "metadata_only" if images else "no_images_found",
            "note": (
                "Likely editorial image references were extracted. "
                "Image pixels were not downloaded or analyzed; "
                "AI-generation and manipulation detection were not performed."
                if images else
                "No suitable editorial images were found in the available page HTML."
            ),
            "image_count": len(images),
            "images": images
        }

    except Exception as exc:
        return {
            "status": "unavailable",
            "note": f"Image metadata extraction failed ({type(exc).__name__}).",
            "images": []
        }

def fetch_article_text(raw_url: str) -> str:
    parsed = urlparse(raw_url.strip())

    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid HTTP or HTTPS article URL."
        )

    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=400,
            detail="URLs containing login credentials are not supported."
        )

    host = parsed.hostname

    try:
        addresses = socket.getaddrinfo(
            host, parsed.port or (443 if parsed.scheme == "https" else 80),
            type=socket.SOCK_STREAM
        )
        if not addresses:
            raise ValueError("No address found")

        for address in addresses:
            if not ip_address(address[4][0]).is_global:
                raise ValueError("Non-public address")

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="This URL host is invalid or not publicly accessible."
        )

    try:
        # Redirects are deliberately disabled. This is a local-demo
        # safeguard, not a complete production SSRF defense.
        with httpx.Client(
            timeout=12.0,
            follow_redirects=False,
            trust_env=False,
            headers={"User-Agent": "VeritasNewsAnalyzer/1.0"}
        ) as client:
            with client.stream("GET", raw_url.strip()) as response:
                if response.status_code in (301, 302, 303, 307, 308):
                    raise HTTPException(
                        status_code=400,
                        detail="This article URL redirects. Try the final article URL."
                    )

                response.raise_for_status()

                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                    raise HTTPException(
                        status_code=415,
                        detail="The URL did not return an HTML article page."
                    )

                chunks = []
                total = 0
                max_bytes = 2 * 1024 * 1024

                for chunk in response.iter_bytes():
                    total += len(chunk)
                    if total > max_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail="The article page is too large to analyze."
                        )
                    chunks.append(chunk)

                html = b"".join(chunks)

        soup = BeautifulSoup(html, "lxml")

        for element in soup([
            "script", "style", "nav", "footer", "header",
            "aside", "form", "noscript", "svg"
        ]):
            element.decompose()

        article = soup.find("article")
        container = article if article else soup.body or soup

        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        paragraphs = [
            p.get_text(" ", strip=True)
            for p in container.find_all("p")
        ]
        body = " ".join(p for p in paragraphs if p)

        extracted = f"{title}. {body}".strip()

        if len(body) < 100:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not extract enough article text from this page. "
                    "Paste the article text instead."
                )
            )

        return extracted[:200000]

    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"The article website returned HTTP {exc.response.status_code}."
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve this article. Check the URL or paste its text."
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="The article page could not be processed."
        )


@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "Veritas API",
        "model_loaded": True
    }




import hashlib
import time

GDELT_CACHE_TTL = 1800
GDELT_FAILURE_CACHE_TTL = 600
GDELT_CACHE = {}

GDELT_MIN_REQUEST_INTERVAL = 5.5
GDELT_LAST_REQUEST_TIME = 0.0
def search_independent_coverage(content: str, source_url: str | None = None) -> dict:
    """Find related news coverage; coverage alone does not prove truth."""
    cache_key = hashlib.sha256(
        ((source_url or "") + "\n" + content[:2000]).encode("utf-8")
    ).hexdigest()

    cached = GDELT_CACHE.get(cache_key)
    if cached:
        cached_ttl = (
            GDELT_FAILURE_CACHE_TTL
            if cached["result"].get("score") is None
            else GDELT_CACHE_TTL
        )
        if time.time() - cached["time"] < cached_ttl:
            return cached["result"]
        GDELT_CACHE.pop(cache_key, None)
    import re
    from urllib.parse import urlparse

    stopwords = {
        "the", "and", "for", "with", "that", "this", "from", "have",
        "has", "was", "were", "are", "will", "after", "before", "about",
        "into", "over", "under", "says", "said", "their", "they", "its",
        "not", "but", "who", "what", "when", "where", "how", "his",
        "her", "she", "him", "out", "all", "one", "two", "more"
    }

    headline = next(
        (line.strip() for line in content.splitlines() if line.strip()),
        ""
    )
    words = re.findall(r"[A-Za-z][A-Za-z'-]{2,}", headline[:400].lower())
    keywords = list(dict.fromkeys(
        word for word in words if word not in stopwords
    ))[:8]

    if len(keywords) < 3:
        return {
            "score": None,
            "details": {
                "status": "insufficient_search_terms",
                "note": "Could not extract enough headline keywords.",
                "articles": []
            }
        }

    source_domain = None
    if source_url:
        source_domain = (
            urlparse(source_url).hostname or ""
        ).lower().removeprefix("www.")

    global GDELT_LAST_REQUEST_TIME

    try:
        elapsed = time.time() - GDELT_LAST_REQUEST_TIME
        if elapsed < GDELT_MIN_REQUEST_INTERVAL:
            time.sleep(GDELT_MIN_REQUEST_INTERVAL - elapsed)

        GDELT_LAST_REQUEST_TIME = time.time()

        response = httpx.get(
            "https://api.gdeltproject.org/api/v2/doc/doc",
            params={
                "query": " ".join(keywords),
                "mode": "ArtList",
                "format": "json",
                "maxrecords": 10,
                "timespan": "3months"
            },
            timeout=httpx.Timeout(25.0, connect=10.0),
            follow_redirects=False,
            headers={
                "User-Agent": "Mozilla/5.0 VeritasNewsAnalyzer/1.0"
            }
        )
        response.raise_for_status()
        payload = response.json()

        articles = []
        seen_domains = set()

        for item in payload.get("articles", []):
            domain = (item.get("domain") or "").lower().removeprefix("www.")
            url = item.get("url")
            title = item.get("title")

            if not domain or not url or not title:
                continue

            if source_domain and domain == source_domain:
                continue

            if domain in seen_domains:
                continue

            seen_domains.add(domain)
            articles.append({
                "title": title,
                "url": url,
                "domain": domain,
                "published": item.get("seendate")
            })

        count = len(articles)
        score = (
            85 if count >= 4 else
            75 if count == 3 else
            60 if count == 2 else
            40 if count == 1 else
            None
        )

        result = {
            "score": score,
            "details": {
                "status": "coverage_found" if count else "no_matching_coverage",
                "independent_domains": count,
                "note": (
                    "Related coverage was found. This does not verify every claim."
                    if count else
                    "No matching coverage was found. This does not mean the article is false."
                ),
                "articles": articles
            }
        }
        GDELT_CACHE[cache_key] = {"time": time.time(), "result": result}
        return result

    except httpx.HTTPStatusError as exc:
        rate_limited = exc.response.status_code == 429
        result = {
            "score": None,
            "details": {
                "status": "rate_limited" if rate_limited else "search_unavailable",
                "note": (
                    "The free news-search service is rate-limiting requests. "
                    "No claim score was calculated."
                    if rate_limited else
                    f"News search returned HTTP {exc.response.status_code}."
                ),
                "articles": []
            }
        }
        GDELT_CACHE[cache_key] = {"time": time.time(), "result": result}
        return result

    except (httpx.HTTPError, ValueError, TypeError) as exc:
        result = {
            "score": None,
            "details": {
                "status": "search_unavailable",
                "note": f"News search failed: {type(exc).__name__}.",
                "articles": []
            }
        }
        GDELT_CACHE[cache_key] = {"time": time.time(), "result": result}
        return result

def analyze_signals(content: str, raw_url: str | None = None) -> dict:
    """Return transparent, limited indicators; never invent evidence."""

    claim_check = search_independent_coverage(content, raw_url)

    media_check = inspect_article_images(raw_url) if raw_url else {
        "status": "unavailable",
        "note": "A URL is required to inspect article images.",
        "images": []
    }

    import re

    source_score = None
    source_domain = None
    source_status = "unavailable"
    source_note = "A URL is required to inspect the publisher domain."

    if raw_url:
        try:
            source_domain = (urlparse(raw_url).hostname or "").lower()
            if source_domain.startswith("www."):
                source_domain = source_domain[4:]

            if source_domain:
                known_domains = {
                    "thehindu.com",
                    "bbc.com",
                    "bbc.co.uk",
                    "reuters.com",
                    "apnews.com",
                    "indianexpress.com",
                    "theguardian.com",
                    "nytimes.com",
                    "npr.org",
                }

                recognized = any(
                    source_domain == domain
                    or source_domain.endswith("." + domain)
                    for domain in known_domains
                )

                source_score = 70 if recognized else 45
                source_status = "domain_checked"
                source_note = (
                    "Domain matches a small configured publisher list. "
                    "This is not an independent reputation audit."
                    if recognized
                    else
                    "Domain is not in the small configured publisher list. "
                    "This does not mean the publisher is unreliable."
                )
        except Exception:
            source_note = "The publisher domain could not be inspected."

    pressure_patterns = [
        (r"\bbreaking\b", 2),
        (r"\bshocking\b", 2),
        (r"\bunbelievable\b", 2),
        (r"\bmust share\b", 3),
        (r"\bshare immediately\b", 3),
        (r"\bwhat they don't want you to know\b", 3),
        (r"\b100%\s*(?:true|proof|guaranteed)\b", 2),
        (r"\b(always|never|everyone|nobody|undeniable)\b", 1),
        (r"!{2,}", 1),
        (r"\b(secret|exposed|miracle|shocking truth)\b", 1),
    ]

    pressure_hits = []
    pressure_points = 0
    lowered = content.lower()

    for pattern, weight in pressure_patterns:
        matches = re.findall(pattern, lowered, flags=re.IGNORECASE)
        if matches:
            pressure_points += len(matches) * weight
            pressure_hits.append(pattern)

    language_score = max(0, min(100, 100 - pressure_points * 8))

    return {
        "source": source_score,
        "language": language_score,
        "claim": claim_check["score"],
        "media": None,
        "details": {
            "source": {
                "status": source_status,
                "domain": source_domain,
                "note": source_note,
            },
            "language": {
                "status": "rule_based",
                "pressure_matches": len(pressure_hits),
                "note": (
                    "Heuristic language score, not a truth score. "
                    "Language patterns can occur in genuine reporting."
                ),
            },
            "claim": claim_check["details"],
            "media": media_check,
        },
    }

@app.post("/api/predict")
def predict(request: PredictRequest):
    original_input = request.input.strip()

    if not original_input:
        raise HTTPException(
            status_code=400,
            detail="Please enter article text or a URL."
        )

    if request.mode == "url":
        content = fetch_article_text(original_input)
    else:
        content = original_input

    if len(content.strip()) < 30:
        raise HTTPException(
            status_code=422,
            detail="Please provide at least 30 characters of article text."
        )

    try:
        probabilities = model.predict_proba([content])[0]
        classes = list(model.named_steps["classifier"].classes_)
        probability_by_class = {
            int(label): float(probability)
            for label, probability in zip(classes, probabilities)
        }

        probability_real = probability_by_class.get(0, 0.0)
        probability_fake = probability_by_class.get(1, 0.0)
        prediction = "fake" if probability_fake >= probability_real else "real"
        confidence = max(probability_fake, probability_real)

        return {
            "mode": request.mode,
            "input": original_input,
            "prediction": prediction,
            "verdict": (
                "Likely Fake News"
                if prediction == "fake"
                else "Likely Real News"
            ),
            "verdictTone": prediction,
            "confidence": round(confidence * 100, 2),
            "probability_fake": round(probability_fake * 100, 2),
            "probability_real": round(probability_real * 100, 2),
            "composite": round(confidence * 100, 2),
            "signals": analyze_signals(content, original_input if request.mode == "url" else None),
            "model_note": (
                "Prediction from a TF-IDF and Logistic Regression model "
                "trained on WELFake. This is not independent fact-checking."
            )
        }

    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=500,
            detail="The model could not analyze this input."
        )
















