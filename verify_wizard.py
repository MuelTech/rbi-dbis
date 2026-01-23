from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Login
        print("Navigating to login page...")
        page.goto("http://localhost:3000/login")

        print("Filling credentials...")
        page.fill("input[placeholder='Enter username']", "admin")
        page.fill("input[placeholder='Enter password']", "password123")
        page.click("button[type='submit']")

        # Wait for dashboard
        print("Waiting for dashboard...")
        page.wait_for_url("**/dashboard")

        # 2. Navigate to Residents
        print("Navigating to Residents...")
        # We can use the text "Residents" in the sidebar
        page.get_by_role("button", name="Residents").click()
        page.wait_for_url("**/residents")

        # 3. Open Add Resident Wizard
        print("Opening Add Resident Wizard...")
        # Check if the button exists and click it.
        # Using exact=False to match "Add Residents" even if there's an icon
        add_button = page.get_by_role("button", name="Add Residents", exact=False)
        add_button.wait_for()
        add_button.click()

        # 4. Verify Wizard Steps
        print("Verifying Wizard Steps...")

        # Step 1: Family Details
        # The wizard should show "Family Details" or similar indicating the first step
        try:
            page.wait_for_selector("text=Family Details", timeout=5000)
            print(" - Step 1: Family Details visible")
        except:
            print(" - Step 1 header not found, taking screenshot")
            page.screenshot(path="verification/wizard_fail.png")
            raise

        # Check for "Next" button
        next_button = page.get_by_role("button", name="Next")
        if next_button.is_visible():
            print(" - Next button is visible")

        # Check for "Cancel" button
        cancel_button = page.get_by_role("button", name="Cancel")
        if cancel_button.is_visible():
            print(" - Cancel button is visible")

        print("Taking screenshot of successful wizard...")
        page.screenshot(path="verification/wizard_success.png")

        print("Verification successful!")
        browser.close()

if __name__ == "__main__":
    run()
