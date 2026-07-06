with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

bad = """          <div className="mt-4 md:-mt-32 relative z-30 pb-20">
            {renderTop10()}
            <AdZone zoneName="home-top" />
            {renderRow("Latest Releases", latestReleases)}
            {renderRow("Trending Now", trendingNow)}
            <AdZone zoneName="home-middle" />
            {renderRow("Action Movies", actionMovies)}
            {renderRow("TV Series", tvSeries)}
            <AdZone zoneName="home-bottom" />
          </div>"""

good = """          <div className="mt-4 md:-mt-32 relative z-30 pb-20">
            <AdZone zoneName="home-top" />
            {renderTop10()}
            <AdZone zoneName="home-row-1" />
            {renderRow("Latest Releases", latestReleases)}
            <AdZone zoneName="home-row-2" />
            {renderRow("Trending Now", trendingNow)}
            <AdZone zoneName="home-row-3" />
            {renderRow("Action Movies", actionMovies)}
            <AdZone zoneName="home-row-4" />
            {renderRow("TV Series", tvSeries)}
            <AdZone zoneName="home-bottom" />
          </div>"""

content = content.replace(bad, good)
with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
