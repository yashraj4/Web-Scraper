from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
import cloudscraper
import re
import logging

logger = logging.getLogger(__name__)


class ScraperEngine:
    def __init__(self, method: str = "cloudscraper"):
        """
        Initialize scraper with specified method.
        
        Args:
            method: Scraping method - 'cloudscraper', 'playwright', or 'requests'
        """
        self.method = method
        self._playwright_browser = None
        
        if method == "cloudscraper":
            self.scraper = cloudscraper.create_scraper(
                browser={
                    'browser': 'chrome', 
                    'platform': 'windows', 
                    'desktop': True,
                    'mobile': False
                }
            )
    
    def fetch(self, url: str) -> str:
        """Fetch HTML from URL using the configured method."""
        if self.method == "playwright":
            return self._fetch_playwright(url)
        elif self.method == "requests":
            return self._fetch_requests(url)
        else:
            return self._fetch_cloudscraper(url)
    
    def _fetch_cloudscraper(self, url: str) -> str:
        """Fetch using cloudscraper (handles Cloudflare)."""
        try:
            response = self.scraper.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Cloudscraper error fetching {url}: {str(e)}")
            raise
    
    def _fetch_requests(self, url: str) -> str:
        """Fetch using plain requests."""
        import requests
        resp = requests.get(
            url, 
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }, 
            timeout=30
        )
        resp.raise_for_status()
        return resp.text
    
    def _fetch_playwright(self, url: str) -> str:
        """Fetch using Playwright (handles JavaScript rendering)."""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.error("Playwright module not found.")
            raise ImportError("Playwright is not installed. If running in Docker, try rebuilding with 'docker-compose up --build'.")
        
        try:
            with sync_playwright() as p:
                # Use a realistic browser setup
                browser = p.chromium.launch(headless=True)
                
                # Setup context with more realistic settings
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    viewport={'width': 1920, 'height': 1080},
                    device_scale_factor=1,
                    has_touch=False,
                    is_mobile=False,
                    java_script_enabled=True,
                )
                
                page = context.new_page()
                
                # Mock some common browser features that bot detectors check
                page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                    window.chrome = { runtime: {} };
                    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                """)

                # Set extra headers
                page.set_extra_http_headers({
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-User": "?1",
                    "Sec-Fetch-Dest": "document",
                })

                logger.info(f"Navigating to {url} with Playwright (stealth mode)...")
                
                # Try to go to base URL first to establish some session state if it's a deep link
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                base_url = f"{urlparse(url).scheme}://{domain}/"
                
                try:
                    logger.info(f"Visiting base URL {base_url} first...")
                    page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
                    page.wait_for_timeout(2000)
                except:
                    logger.warning("Failed to visit base URL, continuing to target...")

                response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                if response and response.status == 403:
                    logger.warning("Got 403 Forbidden. Trying one more time with different UA and delay...")
                    # Small wait
                    page.wait_for_timeout(5000)
                    context.set_extra_http_headers({
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                        "Referer": base_url
                    })
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)

                # Wait for content to settle
                page.wait_for_timeout(10000)
                
                # Specifically wait for price if it's there
                try:
                    # Give it a bit of time to render JS-based prices
                    page.wait_for_selector("[automation-id='productPriceOutput']", timeout=10000)
                except:
                    pass
                
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error(f"Playwright error fetching {url}: {str(e)}")
            raise
    
    def extract(self, html: str, selectors: Dict[str, str]) -> List[Dict[str, Any]]:
        """Extract data from HTML using CSS selectors."""
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        container_selector = selectors.get('_container', 'body')
        
        try:
            elements = soup.select(container_selector)
        except Exception as e:
            logger.error(f"Error selecting container '{container_selector}': {str(e)}")
            elements = [soup]
        
        if not elements:
            elements = [soup]
        
        item_selectors = {k: v for k, v in selectors.items() if not k.startswith('_')}
        
        if not item_selectors:
            item_selectors = {"content": "body"}
        
        for el in elements:
            record = {}
            for field_name, selector in item_selectors.items():
                try:
                    if selector.startswith('regex:'):
                        pattern = selector[6:]
                        match = re.search(pattern, str(el))
                        record[field_name] = match.group(1) if match else None
                    else:
                        found = el.select_one(selector)
                        record[field_name] = found.text.strip() if found and found.text else None
                except Exception as e:
                    logger.warning(f"Error extracting '{field_name}' with selector '{selector}': {str(e)}")
                    record[field_name] = None
            
            if any(v is not None for v in record.values()):
                results.append(record)
        
        logger.info(f"Extracted {len(results)} records from {len(elements)} elements")
        return results
    
    def scrape(self, url: str, selectors: Dict[str, str]) -> List[Dict[str, Any]]:
        """Main scraping method - fetch and extract."""
        logger.info(f"Starting scrape of {url} using {self.method} with selectors: {selectors}")
        html = self.fetch(url)
        results = self.extract(html, selectors)
        logger.info(f"Scrape completed: {len(results)} records")
        return results
    
    def close(self):
        """Cleanup resources."""
        if self._playwright_browser:
            self._playwright_browser.close()


def parse_price(price_str: str) -> Optional[float]:
    """Parse price string to float."""
    if not price_str:
        return None
    cleaned = price_str.replace(',', '').replace('$', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return None
