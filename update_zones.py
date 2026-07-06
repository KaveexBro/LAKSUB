import re

with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

new_options = """                <option value="home-top">Home - Top</option>
                <option value="home-row-1">Home - After Top 10</option>
                <option value="home-row-2">Home - After Latest Releases</option>
                <option value="home-row-3">Home - After Trending</option>
                <option value="home-row-4">Home - After Action</option>
                <option value="home-bottom">Home - Bottom</option>
                <option value="explore-top">Explore - Top</option>
                <option value="explore-middle-1">Explore - Middle 1</option>
                <option value="explore-middle-2">Explore - Middle 2</option>
                <option value="explore-bottom">Explore - Bottom</option>
                <option value="subtitle-details-top">Subtitle Details - Top</option>
                <option value="subtitle-details-content-1">Subtitle Details - Content 1</option>
                <option value="subtitle-details-content-2">Subtitle Details - Content 2</option>
                <option value="subtitle-details-content-3">Subtitle Details - Content 3</option>
                <option value="subtitle-details-content-4">Subtitle Details - Content 4</option>
                <option value="subtitle-details-middle">Subtitle Details - Middle</option>
                <option value="subtitle-details">Subtitle Details (Download Area)</option>
                <option value="subtitle-details-bottom">Subtitle Details - Bottom</option>
                <option value="series-details-top">Series Details - Top</option>
                <option value="series-details-middle">Series Details - Middle</option>
                <option value="series-details">Series Details (Episodes)</option>
                <option value="series-details-bottom">Series Details - Bottom</option>
                <option value="download-popup">Download Pop-up</option>
                <option value="faq-top">FAQ - Top</option>
                <option value="faq-bottom">FAQ - Bottom</option>
                <option value="top-subtitlers-top">Top Subtitlers - Top</option>
                <option value="top-subtitlers-bottom">Top Subtitlers - Bottom</option>
                <option value="global-sidebar">Global - Sidebar</option>
                <option value="global-footer">Global - Footer</option>"""

# Replace options block in AdManager
content = re.sub(
    r'<option value="home-top">Home - Top</option>.*?<option value="global-footer">Global - Footer</option>',
    new_options,
    content,
    flags=re.DOTALL
)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
