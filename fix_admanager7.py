with open('src/components/AdManager.tsx', 'r') as f:
    c = f.read()

bad_select = """            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Zone</label>
              <select 
                value={currentAd.zone} 
                onChange={e => setCurrentAd({...currentAd, zone: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="home-top">Home - Top</option>
                <option value="home-middle">Home - Middle</option>
                <option value="home-bottom">Home - Bottom</option>
                <option value="explore-top">Explore - Top</option>
                <option value="explore-middle">Explore - Middle</option>
                <option value="explore-bottom">Explore - Bottom</option>
                <option value="subtitle-details-top">Subtitle Details - Top</option>
                <option value="subtitle-details-content-1">Subtitle Details - Content 1</option>
                <option value="subtitle-details-content-2">Subtitle Details - Content 2</option>
                <option value="subtitle-details-content-3">Subtitle Details - Content 3</option>
                <option value="subtitle-details-middle">Subtitle Details - Middle</option>
                <option value="subtitle-details">Subtitle Details (Download Area)</option>
                <option value="subtitle-details-bottom">Subtitle Details - Bottom</option>
                <option value="series-details-top">Series Details - Top</option>
                <option value="series-details">Series Details (Episodes)</option>
                <option value="series-details-bottom">Series Details - Bottom</option>
                <option value="download-popup">Download Pop-up</option>
                <option value="faq-top">FAQ - Top</option>
                <option value="faq-bottom">FAQ - Bottom</option>
                <option value="top-subtitlers-top">Top Subtitlers - Top</option>
                <option value="top-subtitlers-bottom">Top Subtitlers - Bottom</option>
                <option value="global-sidebar">Global - Sidebar</option>
                <option value="global-footer">Global - Footer</option>
              </select>
            </div>"""

good_select = """            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Zones (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                multiple
                value={currentAd.zones || []} 
                onChange={e => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) {
                      selected.push(options[i].value);
                    }
                  }
                  setCurrentAd({...currentAd, zones: selected});
                }}
                className="w-full h-48 bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="home-top">Home - Top</option>
                <option value="home-middle">Home - Middle</option>
                <option value="home-bottom">Home - Bottom</option>
                <option value="explore-top">Explore - Top</option>
                <option value="explore-middle">Explore - Middle</option>
                <option value="explore-bottom">Explore - Bottom</option>
                <option value="subtitle-details-top">Subtitle Details - Top</option>
                <option value="subtitle-details-content-1">Subtitle Details - Content 1</option>
                <option value="subtitle-details-content-2">Subtitle Details - Content 2</option>
                <option value="subtitle-details-content-3">Subtitle Details - Content 3</option>
                <option value="subtitle-details-middle">Subtitle Details - Middle</option>
                <option value="subtitle-details">Subtitle Details (Download Area)</option>
                <option value="subtitle-details-bottom">Subtitle Details - Bottom</option>
                <option value="series-details-top">Series Details - Top</option>
                <option value="series-details">Series Details (Episodes)</option>
                <option value="series-details-bottom">Series Details - Bottom</option>
                <option value="download-popup">Download Pop-up</option>
                <option value="faq-top">FAQ - Top</option>
                <option value="faq-bottom">FAQ - Bottom</option>
                <option value="top-subtitlers-top">Top Subtitlers - Top</option>
                <option value="top-subtitlers-bottom">Top Subtitlers - Bottom</option>
                <option value="global-sidebar">Global - Sidebar</option>
                <option value="global-footer">Global - Footer</option>
              </select>
            </div>"""

c = c.replace(bad_select, good_select)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(c)
