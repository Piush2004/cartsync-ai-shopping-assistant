# Importing cloth details into the catalog

The products page used to show 7 hand-typed items. `import_catalog.py` fills it with real clothes
read from product pages.

## Use it

1. Copy `apps/api/product_links.example.txt` to `apps/api/product_links.txt`.
2. Put one product-page link per line (Myntra, Amazon or Flipkart). `#` starts a comment.
3. From `apps/api`:

```powershell
venv\Scripts\python import_catalog.py product_links.txt --dry-run   # look first, saves nothing
venv\Scripts\python import_catalog.py product_links.txt             # save
```

Results go to `apps/api/data/imported_products.json`. The products page (website and phone) shows them
on the next load; no restart needed once the backend runs this code. Run again any time: the same page
refreshes its entry, it is not duplicated. Delete the file to go back to the 7 seed products.

## What is saved per cloth

name, brand, photo link, price, category (T-Shirt, Jeans, Hoodie, ...), fit type (Slim, Relaxed,
Oversized, Regular), department (men / women), and the page it came from. Category and fit type are read
from the title words, e.g. "Slim Fit" gives Slim. A title that says nothing about fit is Regular.

## What it will not do

- Only `myntra.com`, `amazon.*`, `flipkart.com` links. Same allowlist as the in-app link preview.
- It reads `robots.txt` first. A page the site disallows, or a site whose `robots.txt` cannot be read,
  is skipped.
- One page at a time with a pause (default 3 s, `--delay` to change).
- A page that does not name its brand is skipped, not guessed.
- It does not work around blocks. Zara and H&M answer "Access Denied" to bots, Nike's `robots.txt`
  bans product pages, so those brands cannot be imported this way. Use an official feed or affiliate
  API for them.

## Known limits

- Python's `robotparser` ignores `*` wildcards inside a rule, so a wildcard-only rule can be missed.
  Keep the lists small and the pause on.
- Photos are linked from the shop's own image server, not copied. If the shop moves a photo, the card
  falls back to the bag icon. Price has no currency saved (Myntra is INR) and is not shown in the app yet.
- Myntra sometimes shows a different product than an old link's text says; the page's own data wins.
- Check the shop's terms before using this beyond a private test with friends.
