"""
Unit tests for services/link_import/metadata_parser.py against static HTML
fixtures -- no real network calls, no real product pages.
"""
import pytest

from services.link_import import ExtractedProduct, ExtractionError, extract_product

OG_ONLY_HTML = """
<html><head>
<meta property="og:title" content="Nice Blue Shirt" />
<meta property="og:image" content="/images/shirt.jpg" />
</head></html>
"""

JSONLD_PRODUCT_HTML = """
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Van Heusen Slim Shirt",
 "image":["https://cdn.example.com/vh.jpg"],
 "brand":{"@type":"Brand","name":"Van Heusen"},
 "offers":{"@type":"Offer","price":"1299.00","priceCurrency":"INR"}}
</script>
</head></html>
"""

JSONLD_GRAPH_HTML = """
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"WebPage","name":"Some Page"},
  {"@type":"Product","name":"Graph Nested Tee","image":"https://cdn.example.com/tee.jpg",
   "brand":"Uniqlo","offers":{"price":499}}
]}
</script>
</head></html>
"""

JSONLD_ARRAY_TYPE_HTML = """
<html><head>
<script type="application/ld+json">
{"@type":["Product","SomethingElse"],"name":"Multi-typed Item","image":"https://cdn.example.com/x.jpg"}
</script>
</head></html>
"""

JSONLD_TAKES_PRIORITY_OVER_OG_HTML = """
<html><head>
<meta property="og:title" content="OG Fallback Title" />
<meta property="og:image" content="https://cdn.example.com/og.jpg" />
<script type="application/ld+json">
{"@type":"Product","name":"JSON-LD Title Wins","image":"https://cdn.example.com/jsonld.jpg"}
</script>
</head></html>
"""

NO_PRODUCT_DATA_HTML = "<html><body><p>Just a regular page, no product here.</p></body></html>"

MALFORMED_JSONLD_HTML = """
<html><head>
<script type="application/ld+json">{ not valid json at all </script>
<meta property="og:title" content="Fallback After Bad JSON-LD" />
<meta property="og:image" content="https://cdn.example.com/fallback.jpg" />
</head></html>
"""


def test_extracts_from_open_graph_and_resolves_relative_image_url():
    result = extract_product(OG_ONLY_HTML, "https://www.flipkart.com/product/123")
    assert result == ExtractedProduct(
        name="Nice Blue Shirt",
        brand=None,
        image_url="https://www.flipkart.com/images/shirt.jpg",
        price=None,
    )


def test_extracts_from_jsonld_product_with_brand_and_price():
    result = extract_product(JSONLD_PRODUCT_HTML, "https://www.amazon.in/dp/xyz")
    assert result.name == "Van Heusen Slim Shirt"
    assert result.brand == "Van Heusen"
    assert result.image_url == "https://cdn.example.com/vh.jpg"
    assert result.price == 1299.0


def test_extracts_jsonld_product_nested_under_graph():
    result = extract_product(JSONLD_GRAPH_HTML, "https://www.myntra.com/p/1")
    assert result.name == "Graph Nested Tee"
    assert result.brand == "Uniqlo"
    assert result.price == 499.0


def test_extracts_jsonld_with_array_type_field():
    result = extract_product(JSONLD_ARRAY_TYPE_HTML, "https://example.com/p")
    assert result.name == "Multi-typed Item"


def test_jsonld_takes_priority_over_open_graph():
    result = extract_product(JSONLD_TAKES_PRIORITY_OVER_OG_HTML, "https://example.com/p")
    assert result.name == "JSON-LD Title Wins"
    assert result.image_url == "https://cdn.example.com/jsonld.jpg"


def test_falls_back_to_open_graph_when_jsonld_is_malformed():
    result = extract_product(MALFORMED_JSONLD_HTML, "https://example.com/p")
    assert result.name == "Fallback After Bad JSON-LD"


def test_raises_extraction_error_when_no_product_data_present():
    with pytest.raises(ExtractionError, match="Could not find product details"):
        extract_product(NO_PRODUCT_DATA_HTML, "https://example.com/p")


def test_raises_extraction_error_on_empty_html():
    with pytest.raises(ExtractionError):
        extract_product("", "https://example.com/p")
