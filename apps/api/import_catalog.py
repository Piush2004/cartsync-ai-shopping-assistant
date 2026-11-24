"""
Fill the product catalog from real product pages.

    venv/Scripts/python import_catalog.py product_links.txt
    venv/Scripts/python import_catalog.py product_links.txt --dry-run

`product_links.txt`: one product-page link per line (Myntra, Amazon or
Flipkart), `#` starts a comment. Each page is read the way the in-app link
preview reads it, one at a time with a pause, only if the site's robots.txt
allows it. Results land in data/imported_products.json and show up on the
products page straight away (restart not needed). Run it again any time: the
same page just refreshes its entry.
"""
import argparse
import sys
from pathlib import Path

from services.product_intelligence import catalog_import


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Import cloth details from product-page links.")
    parser.add_argument("links_file", help="text file with one product link per line")
    parser.add_argument("--delay", type=float, default=catalog_import.DEFAULT_DELAY_SECONDS,
                        help="seconds to wait between pages (default %(default)s)")
    parser.add_argument("--dry-run", action="store_true", help="read the pages and print, save nothing")
    parser.add_argument("--out", type=Path, default=None, help="catalog file to write (default data/imported_products.json)")
    args = parser.parse_args(argv)

    try:
        text = Path(args.links_file).read_text(encoding="utf-8")
    except OSError as exc:
        print(f"Cannot read {args.links_file}: {exc}", file=sys.stderr)
        return 2

    urls = catalog_import.read_url_list(text)
    if not urls:
        print("No links found in the file.", file=sys.stderr)
        return 2
    print(f"{len(urls)} link(s). Pausing {args.delay:g}s between pages.\n")

    def show(status: str, url: str, detail: str) -> None:
        label = "OK  " if status == "ok" else "SKIP"
        print(f"[{label}] {detail}\n        {url}")

    result = catalog_import.import_urls(urls, delay=args.delay, on_progress=show)

    print(f"\nRead {len(result.added)} of {len(urls)} page(s); skipped {len(result.skipped)}.")
    if result.added and not args.dry_run:
        total = catalog_import.save_imported_products(result.added, args.out)
        where = args.out or catalog_import.IMPORTED_PRODUCTS_PATH
        print(f"Saved. {where} now holds {total} product(s).")
    elif args.dry_run:
        print("Dry run: nothing saved.")
    return 0 if result.added else 1


if __name__ == "__main__":
    sys.exit(main())
