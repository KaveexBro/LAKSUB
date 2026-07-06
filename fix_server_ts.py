import re
with open('server.ts', 'r') as f:
    content = f.read()

redirect_middleware = """
  // Redirect www to non-www and other domains to preferred domain
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const preferredHost = 'laksub.com';
    
    // Skip localhost and IP addresses
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('0.0.0.0')) {
      return next();
    }
    
    if (host !== preferredHost && !host.includes('run.app')) {
      // If it's www.laksub.com or vercel app, redirect
      if (host === 'www.laksub.com' || host.includes('vercel.app')) {
        return res.redirect(301, `https://${preferredHost}${req.originalUrl}`);
      }
    }
    
    // If run.app, we also might want to redirect, but maybe they use it for dev.
    
    next();
  });
"""

content = content.replace('const app = express();', 'const app = express();\n' + redirect_middleware)

with open('server.ts', 'w') as f:
    f.write(content)
