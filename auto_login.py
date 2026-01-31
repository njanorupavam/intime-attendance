import asyncio
from playwright.async_api import async_playwright

# --- CONFIGURATION ---
URL = "https://sahrdaya.etlab.in/user/login"  # Replace with your target website
USERNAME = "123913"           # Replace with your username
PASSWORD = "moonknight"           # Replace with your password

# Common Selectors to try
USERNAME_SELECTORS = [
    "input[name='username']", 
    "input[name='user[name]']", 
    "input[id='user_login']",
    "input[type='text']",
    "input[type='email']"
]

PASSWORD_SELECTORS = [
    "input[name='password']", 
    "input[name='user[password]']", 
    "input[id='user_password']",
    "input[type='password']"
]

LOGIN_BUTTON_SELECTORS = [
    "button[type='submit']", 
    "input[type='submit']", 
    "button:has-text('Login')",
    "button:has-text('Sign in')"
]

async def find_selector(page, selectors, name):
    print(f"Looking for {name} field...")
    for selector in selectors:
        try:
            if await page.is_visible(selector, timeout=2000):
                print(f"Found {name} with: {selector}")
                return selector
        except:
            continue
    print(f"Could not find {name} field.")
    return None

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        print(f"Navigating to {URL}...")
        await page.goto(URL)
        
        # Wait a moment for page load
        await page.wait_for_load_state("networkidle")

        username_selector = await find_selector(page, USERNAME_SELECTORS, "username")
        password_selector = await find_selector(page, PASSWORD_SELECTORS, "password")
        
        if username_selector and password_selector:
            print("Entering credentials...")
            await page.fill(username_selector, USERNAME)
            await page.fill(password_selector, PASSWORD)
            
            btn_selector = await find_selector(page, LOGIN_BUTTON_SELECTORS, "login button")
            if btn_selector:
                print("Clicking login...")
                await page.click(btn_selector)
            else:
                print("Could not find login button. Please click it manually.")
                
            print("Login action completed. Keeping browser open for 10 seconds...")
            await asyncio.sleep(10)
        else:
            print("Could not find login fields. Please check the website structure.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
