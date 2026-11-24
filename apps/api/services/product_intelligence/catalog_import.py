"""
Builds catalog entries from real product pages.

The catalog used to be seven hand-typed products. This reads a list of
product-page links with the same public data the link-import preview reads
(schema.org JSON-LD / Open Graph -- see services/link_import) and saves the
result to a JSON file that CatalogEngine merges with the seed products.

What it deliberately does NOT do:
* fetch hosts outside link_import's allowlist (amazon / flipkart / myntra);
* fetch a page its host's robots.txt disallows, or when robots.txt can't be
  read (unreadable = no);
* hammer a site: one request at a time with a pause between requests;
* work around a block. A refused page is reported and skipped.
"""
import hashlib
import json
import logging
import os
import re
import tempfile
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urldefrag, urlparse
from urllib.robotparser import RobotFileParser

import httpx

from services.http_safety import UnsafeUrlError, fetch_safely
from services.link_import import ExtractionError, FetchError, extract_product, fetch_product_page
from services.link_import.garment_classifier import classify_garment
from services.link_import.page_fetcher import ALLOWED_PRODUCT_HOSTS
from services.stylist.types import CATEGORY_BOTTOM, CATEGORY_DRESS

from .types import Product

logger = logging.getLogger(__name__)

# apps/api/data/imported_products.json
IMPORTED_PRODUCTS_PATH = Path(__file__).resolve().parents[2] / "data" / "imported_products.json"
DEFAULT_DELAY_SECONDS = 3.0

# Product titles rarely state a fit; most say nothing and are "Regular".
# Checked in order, whole words, so "Slim Fit Relaxed Waist" reads as Slim.
_FIT_WORDS = [
    ("Oversized", ["oversized", "oversize", "boxy"]),
    ("Slim", ["slim", "skinny", "tapered", "fitted", "muscle", "tight", "super slim"]),
    ("Relaxed", ["relaxed", "loose", "baggy", "wide", "comfort"]),
    ("Regular", ["regular", "classic", "straight", "original", "standard"]),
]

# Display category, first match wins. "Shirt" is last on purpose: "T-Shirt"
# and "Sweatshirt" contain it.
_CATEGORY_WORDS = [
    ("Hoodie", [r"hoodie", r"hoodies", r"hooded"]),
    ("Sweatshirt", [r"sweatshirt", r"sweatshirts", r"pullover"]),
    ("T-Shirt", [r"t-?\s?shirts?", r"tees?", r"tshirts?", r"polo", r"polos"]),
    ("Jeans", [r"jeans?", r"jeggings?"]),
    ("Shorts", [r"shorts"]),
    ("Trousers", [r"trousers?", r"chinos?", r"pants?", r"joggers?", r"track\s?pants", r"cargos?"]),
    ("Jacket", [r"jackets?", r"coats?", r"blazers?", r"bomber"]),
    ("Shirt", [r"shirts?"]),
]


def _words(text: str) -> str:
    return text.lower().replace("'", "")


def infer_fit_type(name: str) -> str:
    text = _words(name)
    for fit, words in _FIT_WORDS:
        if any(re.search(rf"\b{re.escape(w)}\b", text) for w in words):
            return fit
    return "Regular"


def infer_category(name: str) -> str:
    text = _words(name)
    base, _department = classify_garment(name)
    # A "Shirt Dress" is a dress, whatever else the title says.
    if base == CATEGORY_DRESS:
        return "Dress"
    for label, patterns in _CATEGORY_WORDS:
        if any(re.search(rf"\b{p}\b", text) for p in patterns):
            return label
    return "Bottom" if base == CATEGORY_BOTTOM else "Top"


def _slug(text: str, limit: int) -> str:
    return re.sub(r"[^a-z0-9]+", "-", _words(text)).strip("-")[:limit].strip("-")


def source_key(url: str) -> str:
    """The link without its #fragment: what 'the same page' means here."""
    return urldefrag(url.strip())[0]


def make_product_id(name: str, url: str) -> str:
    """Readable and stable: same page, same id, run after run."""
    digest = hashlib.sha1(source_key(url).encode("utf-8")).hexdigest()[:8]
    return f"{_slug(name, 40) or 'product'}-{digest}"


def build_entry(name: str, brand: str, image_url: str, price: Optional[float], source_url: str) -> Dict:
    _category, department = classify_garment(name)
    return {
        "id": make_product_id(name, source_url),
        "name": name,
        "brand": brand,
        "category": infer_category(name),
        "fit_type": infer_fit_type(name),
        "image_url": image_url,
        "department": department,
        "price": price,
        "source_url": source_key(source_url),
        "imported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


# ---------- the saved file ----------
def _read_entries(path: Path) -> List[Dict]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except (OSError, ValueError) as exc:
        logger.warning("Ignoring unreadable imported catalog %s: %s", path, exc)
        return []
    if not isinstance(raw, list):
        logger.warning("Ignoring imported catalog %s: expected a list", path)
        return []
    return [e for e in raw if isinstance(e, dict)]


def load_imported_products(path: Optional[Path] = None) -> List[Product]:
    """
    Never raises: a missing, broken or hand-edited file must not take the
    products page down -- the seed products still work without it.
    """
    products: List[Product] = []
    for entry in _read_entries(path or IMPORTED_PRODUCTS_PATH):
        try:
            products.append(Product(**entry))
        except Exception as exc:  # pydantic ValidationError / TypeError
            logger.warning("Skipping bad imported product %r: %s", entry.get("id"), exc)
    return products


def save_imported_products(new_entries: Iterable[Dict], path: Optional[Path] = None) -> int:
    """
    Merges by id (a re-import refreshes the same product instead of
    duplicating it) and writes atomically, so an interrupted run can't leave
    a half-written file. Returns how many products the file holds now.
    """
    target = path or IMPORTED_PRODUCTS_PATH
    merged: Dict[str, Dict] = {e["id"]: e for e in _read_entries(target) if e.get("id")}
    for entry in new_entries:
        merged[entry["id"]] = entry

    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=target.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(list(merged.values()), handle, indent=2, ensure_ascii=False)
        os.replace(tmp_name, target)
    except BaseException:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise
    return len(merged)


# ---------- robots.txt ----------
def fetch_robots(robots_url: str) -> Tuple[int, str]:
    """(status, body) for a robots.txt, fetched through the same SSRF guard."""
    response = fetch_safely(robots_url, allowed_hosts=ALLOWED_PRODUCT_HOSTS)
    return response.status_code, response.text


class RobotsCache:
    """
    One robots.txt read per host. Standard reading of the file's answer:
    200 = obey it, 404/410 = no rules, anything else (blocked, error,
    unreachable) = we could not check, so we do not fetch.

    Python's robotparser matches path prefixes only and ignores `*`
    wildcards inside a rule, so a wildcard-only rule can be missed. That is
    why the polite pause and the host allowlist stay on regardless.
    """

    def __init__(self, fetch: Callable[[str], Tuple[int, str]] = fetch_robots, user_agent: str = "*"):
        self._fetch = fetch
        self._agent = user_agent
        self._hosts: Dict[str, Tuple[Optional[RobotFileParser], str]] = {}

    def _load(self, base: str) -> Tuple[Optional[RobotFileParser], str]:
        try:
            status, body = self._fetch(f"{base}/robots.txt")
        except (UnsafeUrlError, httpx.HTTPError) as exc:
            return None, f"could not read robots.txt ({exc})"
        if status in (404, 410):
            parser = RobotFileParser()
            parser.parse([])
            return parser, ""
        if status != 200:
            return None, f"robots.txt not readable (HTTP {status})"
        parser = RobotFileParser()
        parser.parse(body.splitlines())
        return parser, ""

    def allows(self, url: str) -> Tuple[bool, str]:
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        if base not in self._hosts:
            self._hosts[base] = self._load(base)
        parser, problem = self._hosts[base]
        if parser is None:
            return False, problem
        if not parser.can_fetch(self._agent, url):
            return False, "robots.txt does not allow this page"
        return True, ""


# ---------- the batch ----------
@dataclass
class ImportResult:
    added: List[Dict] = field(default_factory=list)
    skipped: List[Tuple[str, str]] = field(default_factory=list)  # (url, reason)


def read_url_list(text: str) -> List[str]:
    """One link per line; blank lines and `# comments` ignored; repeats dropped."""
    seen, urls = set(), []
    for line in text.splitlines():
        line = line.split(" #")[0].strip()
        if not line or line.startswith("#"):
            continue
        key = source_key(line)
        if key not in seen:
            seen.add(key)
            urls.append(line)
    return urls


def import_urls(
    urls: Iterable[str],
    *,
    fetch_page: Callable[[str], str] = fetch_product_page,
    robots: Optional[RobotsCache] = None,
    sleep: Callable[[float], None] = time.sleep,
    delay: float = DEFAULT_DELAY_SECONDS,
    on_progress: Optional[Callable[[str, str, str], None]] = None,
) -> ImportResult:
    """
    Reads each page and returns the entries; saving is the caller's job so a
    dry run changes nothing. `on_progress(status, url, detail)` is called per
    link with status "ok" or "skip".
    """
    robots = robots or RobotsCache()
    result = ImportResult()
    made_request = False

    def skip(url: str, reason: str) -> None:
        result.skipped.append((url, reason))
        if on_progress:
            on_progress("skip", url, reason)

    for url in urls:
        allowed, reason = robots.allows(url)
        if not allowed:
            skip(url, reason)
            continue

        if made_request:
            sleep(delay)
        made_request = True

        try:
            product = extract_product(fetch_page(url), url)
        except (FetchError, ExtractionError) as exc:
            skip(url, str(exc))
            continue

        # Product.brand is required and a made-up brand would feed the brand
        # sizing, so a page that doesn't name its brand is skipped, not guessed.
        if not product.brand:
            skip(url, "page does not say which brand it is")
            continue

        entry = build_entry(product.name, product.brand, product.image_url, product.price, url)
        result.added.append(entry)
        if on_progress:
            on_progress("ok", url, f"{entry['brand']} | {entry['name']} | {entry['category']} / {entry['fit_type']}")
    return result
