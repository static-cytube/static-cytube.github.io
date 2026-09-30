#!/usr/bin/env python3
"""
Scrape every https://cytu.be/r/<room> link from the CyTube rooms directory,
check that each one loads, and flag pages that contain "unregistered".

Every page is rendered in headless Chromium (Playwright), one at a time, so
JavaScript-built room lists and CyTube's websocket-loaded channel messages
are both included.

Setup:
    pip install playwright
    playwright install chromium

Usage:
    python check_cytube_rooms.py
    python check_cytube_rooms.py --out results.csv --wait 4
"""

import argparse
import csv
import re
import sys

# https://playwright.dev/python/docs/api/class-playwright
from playwright.sync_api import Page, sync_playwright

SOURCE_URL = "https://static-cytube.github.io/rooms.html"
ROOM_RE = re.compile(r"https?://(?:www\.)?cytu\.be/r/[A-Za-z0-9_-]+", re.IGNORECASE)
KEYWORD = "unregistered"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def normalize(url: str) -> str:
    """Canonical form so the same room isn't checked twice."""
    url = url.replace("http://", "https://").replace("://www.", "://")
    return url.rstrip("/")


def scrape_links(page: Page) -> list[str]:
    """Render the directory page and collect room links from <a href> tags only."""
    page.goto(SOURCE_URL, wait_until="networkidle", timeout=60_000)
    hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
    found = set()
    for h in hrefs:
        m = ROOM_RE.match(h)  # href must itself be a cytu.be/r/ link
        if m:
            found.add(normalize(m.group(0)))
    return sorted(found, key=str.lower)


def check_room(page: Page, url: str, wait_ms: int) -> dict:
    """Open one room, record whether it loaded, and look for the keyword."""
    result = {"url": url, "status": "", "final_url": "", "works": False, "unregistered": False, "error": ""}
    try:
        response = page.goto(url, wait_until="domcontentloaded", timeout=45_000)
        if response is None:
            result["error"] = "no response"
            return result
        result["status"] = response.status
        result["final_url"] = page.url
        result["works"] = response.ok
        page.wait_for_timeout(wait_ms)  # let CyTube's channel messages arrive
        result["unregistered"] = KEYWORD in page.inner_text("body").lower()
    except Exception as e:  # noqa: BLE001
        result["error"] = f"{type(e).__name__}: {str(e).splitlines()[0][:150]}"
    return result


def main() -> None:
    ap = argparse.ArgumentParser(description="Check CyTube room links.")
    ap.add_argument("--wait", type=float, default=4, help="seconds to wait on each room for messages to load (default 4)")
    ap.add_argument("--out", default="cytube_rooms.csv", help="CSV output path")
    args = ap.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent=USER_AGENT, ignore_https_errors=True)

        print(f"Scraping {SOURCE_URL} ...")
        rooms = scrape_links(page)
        print(f"Found {len(rooms)} unique room links.\n")
        if not rooms:
            browser.close()
            sys.exit(1)

        results = []
        for i, url in enumerate(rooms, 1):
            r = check_room(page, url, int(args.wait * 1000))
            results.append(r)
            state = "OK  " if r["works"] else "FAIL"
            flag = "  [UNREGISTERED]" if r["unregistered"] else ""
            detail = r["status"] or r["error"]
            print(f"[{i}/{len(rooms)}] {state} {detail!s:>4}  {url}{flag}")
            pass  # noqa: PIE790

        browser.close()

    ok = sum(r["works"] for r in results)
    unreg = sum(r["unregistered"] for r in results)
    print(f"\n{ok}/{len(results)} links work; {unreg} contain '{KEYWORD}'.")

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        w.writeheader()
        w.writerows(results)
    print(f"Results saved to {args.out}")


if __name__ == "__main__":
    main()
