import re
with open('src/components/AdBlockDetector.tsx', 'r') as f:
    content = f.read()

bad_check_fetch = """    const checkFetch = async (url: string) => {
      try {
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        return false;
      } catch (e) {
        return true;
      }
    };"""

good_check_fetch = """    const checkFetch = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        return false;
      } catch (e) {
        // If it throws an error (including AbortError), it might be blocked or just slow.
        // We consider it blocked to be safe, but at least we don't hang forever.
        return true;
      }
    };"""

content = content.replace(bad_check_fetch, good_check_fetch)

with open('src/components/AdBlockDetector.tsx', 'w') as f:
    f.write(content)
