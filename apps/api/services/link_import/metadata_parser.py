import json
from typing import Any, Dict, Iterable, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from pydantic import BaseModel


class ExtractedProduct(BaseModel):
    name: str
    brand: Optional[str] = None
    image_url: str
    price: Optional[float] = None


class ExtractionError(Exception):
    """
    Raised when neither Open Graph tags nor schema.org JSON-LD yield a
    usable product name + image from the page. This is the honest-failure
    path -- callers must surface it as-is, never substitute a placeholder
    name/image/price.
    """


def extract_product(html: str, source_url: str) -> ExtractedProduct:
    """
    Reads the same structured data these sites already publish for
    Google/Facebook link previews (Open Graph meta tags and schema.org
    `Product` JSON-LD) -- not scraped from rendered page content, and not
    the search/listing pages the earlier deal-search feature would have
    needed. JSON-LD is preferred where present (more structured: real
    brand/price fields); Open Graph fills in whatever JSON-LD is missing.
    """
    soup = BeautifulSoup(html, "html.parser")

    jsonld = _extract_jsonld_product(soup) or {}
    og = _extract_open_graph(soup)

    name = jsonld.get("name") or og.get("title")
    image_url = jsonld.get("image") or og.get("image")
    brand = jsonld.get("brand")
    price = jsonld.get("price")

    if not name or not image_url:
        raise ExtractionError("Could not find product details (name/image) on this page")

    return ExtractedProduct(
        name=name.strip(),
        brand=brand.strip() if isinstance(brand, str) and brand.strip() else None,
        image_url=urljoin(source_url, image_url),
        price=price,
    )


def _extract_open_graph(soup: BeautifulSoup) -> Dict[str, str]:
    result: Dict[str, str] = {}
    for prop, key in [("og:title", "title"), ("og:image", "image")]:
        tag = soup.find("meta", attrs={"property": prop})
        if tag and tag.get("content"):
            result[key] = tag["content"].strip()
    return result


def _iter_jsonld_nodes(data: Any) -> Iterable[dict]:
    items = data if isinstance(data, list) else [data]
    for item in items:
        if not isinstance(item, dict):
            continue
        yield item
        graph = item.get("@graph")
        if isinstance(graph, list):
            for node in graph:
                if isinstance(node, dict):
                    yield node


def _node_type_is_product(node: dict) -> bool:
    node_type = node.get("@type")
    if isinstance(node_type, str):
        return node_type == "Product"
    if isinstance(node_type, list):
        return "Product" in node_type
    return False


def _extract_jsonld_product(soup: BeautifulSoup) -> Optional[Dict[str, Any]]:
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, TypeError):
            continue
        for node in _iter_jsonld_nodes(data):
            if _node_type_is_product(node):
                parsed = _parse_jsonld_product_node(node)
                if parsed:
                    return parsed
    return None


def _parse_jsonld_product_node(node: dict) -> Optional[Dict[str, Any]]:
    name = node.get("name")

    image = node.get("image")
    if isinstance(image, list) and image:
        image = image[0]
    if isinstance(image, dict):
        image = image.get("url")
    if not isinstance(image, str):
        image = None

    brand = node.get("brand")
    if isinstance(brand, dict):
        brand = brand.get("name")
    if not isinstance(brand, str):
        brand = None

    price = None
    offers = node.get("offers")
    if isinstance(offers, list) and offers:
        offers = offers[0]
    if isinstance(offers, dict):
        raw_price = offers.get("price") or offers.get("lowPrice")
        if raw_price is not None:
            try:
                price = float(raw_price)
            except (TypeError, ValueError):
                price = None

    if not name and not image:
        return None
    return {"name": name, "image": image, "brand": brand, "price": price}
