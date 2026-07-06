import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

bad = """              {!isStandalonePage && <Navbar />}
              <Switch>"""

good = """              {!isStandalonePage && <Navbar />}
              {!isStandalonePage && (
                <div className="max-w-7xl mx-auto px-4 w-full pt-20 pb-4">
                  <AdZone zoneName="global-header" />
                </div>
              )}
              <Switch>"""

content = content.replace(bad, good)
with open('src/App.tsx', 'w') as f:
    f.write(content)
