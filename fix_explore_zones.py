with open('src/pages/Explore.tsx', 'r') as f:
    content = f.read()

bad = """                {index === 11 && (
                  <div className="col-span-full my-4">
                    <AdZone zoneName="explore-middle" />
                  </div>
                )}"""

good = """                {index === 7 && (
                  <div className="col-span-full my-4">
                    <AdZone zoneName="explore-middle-1" />
                  </div>
                )}
                {index === 15 && (
                  <div className="col-span-full my-4">
                    <AdZone zoneName="explore-middle-2" />
                  </div>
                )}"""

content = content.replace(bad, good)
with open('src/pages/Explore.tsx', 'w') as f:
    f.write(content)
