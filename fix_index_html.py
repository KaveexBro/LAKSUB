with open('index.html', 'r') as f:
    content = f.read()

script = """
    <script>
      (function() {
        var host = window.location.hostname;
        var preferredDomain = 'laksub.com';
        var isVercel = host.includes('vercel.app');
        var isWww = host === 'www.laksub.com';
        
        if (isVercel || isWww) {
          if (isVercel) {
            var meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = 'noindex';
            document.head.appendChild(meta);
          }
          var newUrl = 'https://' + preferredDomain + window.location.pathname + window.location.search + window.location.hash;
          window.location.replace(newUrl);
        }
      })();
    </script>
"""

# Inject right after <head>
content = content.replace('<head>', '<head>\n' + script)

with open('index.html', 'w') as f:
    f.write(content)
