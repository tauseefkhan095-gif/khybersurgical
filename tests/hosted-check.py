"""Optional end-to-end tests over real HTTP at / and /ks-medical-website/.
Requires Python Playwright and Chromium; not a build or runtime dependency.
Uses synthetic form data. No email or live external-service requests are made.
"""
from pathlib import Path
import json
import os
import shutil
import socket
import subprocess
import time
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
RESULTS = []
LOCALES = {'en': ('en-IN', 'ltr'), 'ar': ('ar', 'rtl'), 'fa': ('fa', 'rtl'), 'tr': ('tr', 'ltr')}
PAGES = ['', 'products/', 'about/', 'contact/', 'privacy/'] + [
    f'products/{p}/' for p in ['iv-infusion-sets', 'iv-cannulas', 'syringes', 'blood-transfusion-sets', 'medical-gloves', 'measured-volume-sets']]

def record(name, condition, detail=''):
    RESULTS.append({'name': name, 'passed': bool(condition), 'detail': detail})
    if not condition:
        raise AssertionError(f'{name}: {detail}')

def free_port():
    with socket.socket() as connection:
        connection.bind(('127.0.0.1', 0))
        return connection.getsockname()[1]

with sync_playwright() as playwright:
    executable = os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium')
    browser = playwright.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
    for prefix in ['', '/ks-medical-website']:
        label = prefix or 'domain root'
        folder = 'dist-http-check'
        port = free_port()
        origin = f'http://127.0.0.1:{port}'
        env = {**os.environ, 'KS_IGNORE_ENV_FILE': 'true', 'BUILD_DIR': folder, 'BASE_PATH': prefix,
               'SITE_URL': 'https://preview.example', 'INDEXABLE': 'false', 'CONTACT_ENABLED': 'false',
               'DEPLOY_TARGET': 'github-pages' if prefix else '', 'PORT': str(port)}
        subprocess.run(['node', 'scripts/build.mjs'], cwd=ROOT, env=env, check=True, capture_output=True)
        server = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        try:
            for _ in range(80):
                try:
                    with urlopen(origin + prefix + '/', timeout=0.3):
                        break
                except Exception:
                    time.sleep(0.1)
            else:
                raise RuntimeError('Preview server failed to start')
            context = browser.new_context(viewport={'width':1440, 'height':1000}, reduced_motion='reduce')
            context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
            context.route('https://fonts.gstatic.com/**', lambda route: route.abort())
            page = context.new_page()
            errors, posts = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('request', lambda request: posts.append(request.url) if request.method == 'POST' else None)
            page.set_default_timeout(7000)
            broken, malformed = [], []
            for lang, (tag, direction) in LOCALES.items():
                for route in PAGES:
                    url = origin + prefix + '/' + lang + '/' + route
                    response = page.goto(url, wait_until='domcontentloaded')
                    if response.status != 200 or page.locator('h1').count() != 1 or page.locator('html').get_attribute('lang') != tag or page.locator('html').get_attribute('dir') != direction:
                        malformed.append(url)
                    failures = page.evaluate('''async () => {
                        const images = [...document.images];
                        await Promise.all(images.map(image => {image.loading = 'eager'; return image.decode().catch(() => {});}));
                        return images.filter(image => !image.naturalWidth).map(image => image.src);
                    }''')
                    broken.extend(failures)
            record(f'{label}: 44 localized pages load by direct HTTP URL', not malformed, str(malformed))
            record(f'{label}: all product photographs decode successfully', not broken, str(broken))
            page.goto(origin + prefix + '/en/products/', wait_until='domcontentloaded')
            page.locator('[data-filter="access"]').click()
            page.locator('#product-search').fill('cannula')
            record(f'{label}: catalogue filters and query URL work', page.locator('[data-product]:visible').count() == 1 and 'category=access' in page.url)
            page.locator('.product-card-link:visible').click()
            page.wait_for_url('**/products/iv-cannulas/')
            page.reload(wait_until='domcontentloaded')
            page.locator('[data-photo-zoom]').click()
            record(f'{label}: a refreshed product page opens its image viewer', page.locator('.photo-dialog').evaluate('(d)=>d.open'))
            page.keyboard.press('Escape')
            page.locator('.detail-copy .button').click()
            page.wait_for_url('**/contact/?product=iv-cannulas')
            record(f'{label}: product enquiry preselection works', page.locator('#product').input_value() == 'iv-cannulas')
            for key, value in {'name':'Test Buyer','email':'buyer@example.com','message':'Please share the cannula packaging options.'}.items():
                page.locator('#' + key).fill(value)
            page.locator('#country').select_option('IN')
            page.locator('#consent').check()
            page.locator('#language').select_option('fa')
            page.wait_for_url('**/fa/contact/?product=iv-cannulas')
            record(f'{label}: language switching preserves form values and prefix', page.locator('#name').input_value() == 'Test Buyer' and page.locator('#consent').is_checked() and page.url.startswith(origin + prefix + '/fa/'))
            page.locator('#language').select_option('en')
            page.wait_for_url('**/en/contact/?product=iv-cannulas')
            page.locator('.form-submit').click()
            record(f'{label}: preview form never posts or reports delivery', 'has not been sent' in page.locator('#form-result').inner_text() and not posts)
            page.locator('.chat-launcher').click()
            page.locator('[data-chat-topic="products"]').click()
            page.locator('.chat-messages a').last.click()
            page.wait_for_url('**/en/products/')
            record(f'{label}: chatbot links stay inside the website prefix', page.url == origin + prefix + '/en/products/')
            page.locator('#language').select_option('ar')
            page.wait_for_url('**/ar/products/')
            page.goto(origin + prefix + '/', wait_until='domcontentloaded')
            page.wait_for_url('**/ar/')
            record(f'{label}: returning home restores the saved language', page.url == origin + prefix + '/ar/')
            page.evaluate('localStorage.clear()')
            response = page.goto(origin + prefix + '/not-a-page/', wait_until='domcontentloaded')
            record(f'{label}: 404 has working styled navigation', response.status == 404 and page.locator('.brand').first.get_attribute('href') == prefix + '/en/' and page.locator('.site-header').evaluate('(e)=>getComputedStyle(e).position') == 'sticky')
            page.set_viewport_size({'width':390, 'height':844})
            page.goto(origin + prefix + '/ar/', wait_until='domcontentloaded')
            page.locator('.menu-toggle').click()
            record(f'{label}: mobile RTL menu works without overflow', page.locator('#mobile-menu').is_visible() and page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.keyboard.press('Escape')
            record(f'{label}: no uncaught JavaScript errors', not errors, str(errors))
            if prefix:
                output = ROOT / 'test-results' / 'screenshots'
                output.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(output / 'hosted-arabic-mobile.png'))
                page.set_viewport_size({'width':1440, 'height':990})
                page.goto(origin + prefix + '/en/', wait_until='domcontentloaded')
                page.screenshot(path=str(output / 'hosted-home-desktop.png'))
            nojs = browser.new_context(java_script_enabled=False)
            nojs.route('https://fonts.googleapis.com/**', lambda route: route.abort())
            nojs.route('https://fonts.gstatic.com/**', lambda route: route.abort())
            static = nojs.new_page()
            static.goto(origin + prefix + '/en/contact/', wait_until='domcontentloaded')
            record(f'{label}: no-JavaScript preview cannot submit personal data', static.locator('.form-submit').is_disabled())
            nojs.close()
            context.close()
        finally:
            server.terminate()
            server.wait(timeout=5)
            shutil.rmtree(ROOT / folder, ignore_errors=True)
    browser.close()
(ROOT / 'docs' / 'hosted-results.json').write_text(json.dumps(RESULTS, indent=2))
print(f'Hosted browser checks: {sum(r["passed"] for r in RESULTS)}/{len(RESULTS)} passed')
