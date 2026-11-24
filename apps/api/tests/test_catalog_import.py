"""
Importing cloth details from product pages into the catalog. No network:
pages and robots.txt are faked.
"""
import json
from typing import Optional

import pytest

from services.link_import import FetchError
from services.product_intelligence import catalog_import
from services.product_intelligence.catalog_engine import CatalogEngine
from services.product_intelligence.catalog_import import (
    ImportResult,
    RobotsCache,
    build_entry,
    import_urls,
    infer_category,
    infer_fit_type,
    load_imported_products,
    make_product_id,
    read_url_list,
    save_imported_products,
)


def page(name="Roadster Men Slim Fit Jeans", brand: Optional[str] = "Roadster", image="https://img.example/a.jpg", price=799):
    data = {
        "@type": "Product", "name": name, "image": [image],
        "brand": {"@type": "Brand", "name": brand} if brand else None,
        "offers": {"price": price},
    }
    return f'<html><head><script type="application/ld+json">{json.dumps(data)}</script></head></html>'


def allow_all():
    return RobotsCache(fetch=lambda url: (404, ""))


@pytest.fixture
def catalog_file(tmp_path, monkeypatch):
    path = tmp_path / "imported_products.json"
    monkeypatch.setattr(catalog_import, "IMPORTED_PRODUCTS_PATH", path)
    return path


# ---------- reading the title ----------
@pytest.mark.parametrize("name,fit", [
    ("Zara Oversized Hoodie", "Oversized"),
    ("Mast & Harbour Men Slim Fit Jeans", "Slim"),
    ("Men Skinny Fit Stretchable Jeans", "Slim"),
    ("Men Relaxed Fit Cotton T-shirt", "Relaxed"),
    ("Baggy Wide Leg Jeans", "Relaxed"),
    ("Levi's 501 Original Fit Jeans", "Regular"),
    ("Plain Cotton Tee", "Regular"),  # says nothing -> Regular
])
def test_fit_type_is_read_from_the_title(name, fit):
    assert infer_fit_type(name) == fit


@pytest.mark.parametrize("name,category", [
    ("Men Navy Hooded Sweatshirt", "Hoodie"),
    ("Nike Crew Sweatshirt", "Sweatshirt"),
    ("Men Printed Round Neck T-shirt", "T-Shirt"),
    ("Cotton Tee", "T-Shirt"),
    ("Slim Fit Jeans", "Jeans"),
    ("Men Cargo Shorts", "Shorts"),
    ("Men Slim Fit Chinos", "Trousers"),
    ("Denim Jacket", "Jacket"),
    ("Men Checked Casual Shirt", "Shirt"),
    ("Floral Shirt Dress", "Dress"),  # a shirt dress is a dress
    ("Mystery Garment", "Top"),
])
def test_category_is_read_from_the_title(name, category):
    assert infer_category(name) == category


# ---------- entries and ids ----------
def test_product_id_is_stable_and_differs_per_page():
    a = make_product_id("Slim Jeans", "https://www.myntra.com/jeans/a/1/buy")
    assert a == make_product_id("Slim Jeans", "https://www.myntra.com/jeans/a/1/buy#reviews")
    assert a != make_product_id("Slim Jeans", "https://www.myntra.com/jeans/a/2/buy")
    assert a.startswith("slim-jeans-")


def test_entry_has_the_details_and_builds_a_catalog_product(catalog_file):
    entry = build_entry("Roadster Men Slim Fit Jeans", "Roadster", "https://img/a.jpg", 799.0,
                        "https://www.myntra.com/jeans/roadster/1/buy")
    assert entry["category"] == "Jeans" and entry["fit_type"] == "Slim"
    assert entry["department"] == "men"
    assert entry["price"] == 799.0
    assert entry["source_url"] == "https://www.myntra.com/jeans/roadster/1/buy"
    save_imported_products([entry])
    [product] = load_imported_products()
    assert (product.brand, product.category, product.fit_type) == ("Roadster", "Jeans", "Slim")
    assert product.image_url == "https://img/a.jpg"


# ---------- the saved file ----------
def test_missing_file_means_no_imported_products(catalog_file):
    assert load_imported_products() == []


@pytest.mark.parametrize("content", ["not json {", '{"a": 1}', "42"])
def test_broken_file_never_raises(catalog_file, content):
    catalog_file.write_text(content, encoding="utf-8")
    assert load_imported_products() == []


def test_one_bad_entry_does_not_hide_the_good_ones(catalog_file):
    good = build_entry("Slim Jeans", "Roadster", "https://img/a.jpg", None, "https://www.myntra.com/x/1/buy")
    catalog_file.write_text(json.dumps([{"id": "broken"}, good, "junk"]), encoding="utf-8")
    assert [p.id for p in load_imported_products()] == [good["id"]]


def test_saving_again_refreshes_instead_of_duplicating(catalog_file):
    first = build_entry("Slim Jeans", "Roadster", "https://img/a.jpg", 100.0, "https://www.myntra.com/x/1/buy")
    other = build_entry("Relaxed Tee", "HRX", "https://img/b.jpg", 50.0, "https://www.myntra.com/y/2/buy")
    assert save_imported_products([first, other]) == 2
    refreshed = dict(first, price=90.0)
    assert save_imported_products([refreshed]) == 2
    saved = {e["id"]: e for e in json.loads(catalog_file.read_text(encoding="utf-8"))}
    assert saved[first["id"]]["price"] == 90.0
    assert other["id"] in saved


def test_catalog_has_seed_and_imported_products_without_repeats(catalog_file):
    imported = build_entry("Slim Jeans", "Roadster", "https://img/a.jpg", None, "https://www.myntra.com/x/1/buy")
    clash = dict(imported, id="nike_air_tee", name="Impostor")  # same id as a seed product
    save_imported_products([imported, clash])
    products = {p.id: p for p in CatalogEngine.get_all_products()}
    assert imported["id"] in products
    assert products["nike_air_tee"].name == "Nike Air Tee"  # seed wins
    assert len(CatalogEngine.get_all_products()) == 7 + 1


def test_imported_products_reach_the_products_endpoint(client, db_session, catalog_file):
    entry = build_entry("Roadster Men Relaxed Fit Hoodie", "Roadster", "https://img/h.jpg", 1299.0,
                        "https://www.myntra.com/h/roadster/9/buy")
    save_imported_products([entry])
    import uuid
    from models.measurement import EffectiveMeasurement
    db_session.add(EffectiveMeasurement(
        id=str(uuid.uuid4()), user_id="fixture-test-user",
        chest_circumference=98.0, waist_circumference=82.0, confidence_score=1.0,
    ))
    db_session.commit()
    resp = client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 200, resp.text
    found = {p["product"]["id"]: p["product"] for p in resp.json()["products"]}
    assert found[entry["id"]]["image_url"] == "https://img/h.jpg"
    assert found[entry["id"]]["category"] == "Hoodie"


# ---------- the link list ----------
def test_link_list_ignores_comments_blanks_and_repeats():
    text = "\n".join([
        "# my picks",
        "",
        "https://www.myntra.com/a/1/buy",
        "https://www.myntra.com/b/2/buy  # nice one",
        "https://www.myntra.com/a/1/buy#size",   # same page again
    ])
    assert read_url_list(text) == ["https://www.myntra.com/a/1/buy", "https://www.myntra.com/b/2/buy"]


# ---------- robots.txt ----------
def test_page_disallowed_by_robots_is_not_fetched():
    robots = RobotsCache(fetch=lambda url: (200, "User-agent: *\nDisallow: /private/\n"))
    fetched = []
    result = import_urls(
        ["https://www.myntra.com/private/x/1/buy", "https://www.myntra.com/ok/x/2/buy"],
        fetch_page=lambda url: fetched.append(url) or page(),
        robots=robots, sleep=lambda s: None,
    )
    assert fetched == ["https://www.myntra.com/ok/x/2/buy"]
    assert result.skipped == [("https://www.myntra.com/private/x/1/buy", "robots.txt does not allow this page")]


@pytest.mark.parametrize("status", [403, 500])
def test_unreadable_robots_means_no_fetch(status):
    fetched = []
    result = import_urls(
        ["https://www.myntra.com/a/1/buy"],
        fetch_page=lambda url: fetched.append(url) or page(),
        robots=RobotsCache(fetch=lambda url: (status, "denied")), sleep=lambda s: None,
    )
    assert fetched == [] and result.added == []
    assert f"HTTP {status}" in result.skipped[0][1]


def test_robots_is_read_once_per_host():
    calls = []
    robots = RobotsCache(fetch=lambda url: calls.append(url) or (404, ""))
    for n in range(3):
        assert robots.allows(f"https://www.myntra.com/p/{n}/buy") == (True, "")
    assert calls == ["https://www.myntra.com/robots.txt"]


# ---------- the batch ----------
def test_batch_collects_entries_and_pauses_between_pages_only():
    pauses = []
    urls = [f"https://www.myntra.com/p/{n}/buy" for n in range(3)]
    result = import_urls(urls, fetch_page=lambda url: page(name="Slim Jeans " + url.split("/")[-2]),
                         robots=allow_all(), sleep=pauses.append, delay=2.5)
    assert len(result.added) == 3 and result.skipped == []
    assert pauses == [2.5, 2.5]  # before page 2 and 3, not before page 1


def test_a_failed_page_is_reported_and_the_rest_continue():
    def fetch(url):
        if url.endswith("/2/buy"):
            raise FetchError("Could not fetch page (HTTP 403)")
        return page(name="Slim Jeans " + url.split("/")[-2])

    seen = []
    result = import_urls(
        ["https://www.myntra.com/p/1/buy", "https://www.myntra.com/p/2/buy", "https://www.myntra.com/p/3/buy"],
        fetch_page=fetch, robots=allow_all(), sleep=lambda s: None,
        on_progress=lambda status, url, detail: seen.append(status),
    )
    assert len(result.added) == 2
    assert result.skipped == [("https://www.myntra.com/p/2/buy", "Could not fetch page (HTTP 403)")]
    assert seen == ["ok", "skip", "ok"]


def test_page_without_product_data_is_skipped():
    result = import_urls(["https://www.myntra.com/p/1/buy"], fetch_page=lambda url: "<html></html>",
                         robots=allow_all(), sleep=lambda s: None)
    assert result.added == [] and "name/image" in result.skipped[0][1]


def test_page_without_a_brand_is_skipped_not_guessed():
    result = import_urls(["https://www.myntra.com/p/1/buy"], fetch_page=lambda url: page(brand=None),
                         robots=allow_all(), sleep=lambda s: None)
    assert result.added == []
    assert result.skipped[0][1] == "page does not say which brand it is"


def test_host_outside_the_allowlist_is_refused_by_the_real_fetcher():
    # Not faked on purpose: the default fetcher must reject Zara/H&M/Nike
    # links before any request is made.
    result = import_urls(["https://www.zara.com/in/en/some-shirt-p1.html"], robots=allow_all(),
                         sleep=lambda s: None)
    assert result.added == []
    assert "Host not allowed" in result.skipped[0][1]


def test_result_type_is_plain_data():
    assert ImportResult().added == [] and ImportResult().skipped == []
