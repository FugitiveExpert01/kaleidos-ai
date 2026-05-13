import asyncio
from playwright.async_api import async_playwright
import os

async def verify_final():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        url = "http://localhost:8080"

        try:
            await page.goto(url)
            await page.wait_for_load_state("networkidle")

            # 1. Verify cursor is visible on intro screen
            await page.mouse.move(200, 200)
            await page.wait_for_timeout(500)
            cursor = page.locator("#custom-cursor")
            opacity_before = await cursor.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"Cursor Opacity on Intro: {opacity_before}")

            # 2. Verify no transform transition (for performance/lag fix)
            transition = await cursor.evaluate("el => window.getComputedStyle(el).transition")
            print(f"Cursor Transition: {transition}")

            # 3. Click intro screen
            await page.click("#intro-screen")
            await page.wait_for_timeout(1000)

            # 4. Verify scrolling works and nav updates
            # Scroll to "Architecture" section
            await page.evaluate("window.scrollTo(0, 1000)")
            await page.wait_for_timeout(1000)

            # Check if any nav item is active
            active_nav = await page.locator(".nav-item.text-brand").count()
            print(f"Active nav items: {active_nav}")

            # 5. Check cursor hidden state (as per CSS logic)
            opacity_after = await cursor.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"Cursor Opacity after entry: {opacity_after}")

            await page.screenshot(path="verification/screenshots/final_scroll_check.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification/screenshots"):
        os.makedirs("verification/screenshots")
    asyncio.run(verify_final())
