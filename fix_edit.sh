#!/bin/bash
cat << 'INNER_EOF' > insert.txt
                {videoOptions.map((option, index) => (
                  <div key={option.id} className="p-4 bg-black/40 rounded-lg border border-gray-800 space-y-3 relative">
                    <button type="button" onClick={() => removeVideoOption(option.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1">
                      <X className="w-5 h-5" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                        <select 
                          value={option.type} 
                          onChange={(e) => updateVideoOption(option.id, 'type', e.target.value)}
                          className="w-full bg-black border border-gray-700 rounded-md px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                        >
                          <option value="raw">Raw</option>
                          <option value="hardcoded">Hardcoded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Resolution</label>
                        <select 
                          value={option.resolution} 
                          onChange={(e) => updateVideoOption(option.id, 'resolution', e.target.value)}
                          className="w-full bg-black border border-gray-700 rounded-md px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                        >
                          <option value="480p">480p</option>
                          <option value="720p">720p</option>
                          <option value="1080p">1080p</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Source Name</label>
                        <input 
                          type="text" 
                          value={option.sourceName} 
                          onChange={(e) => updateVideoOption(option.id, 'sourceName', e.target.value)}
                          placeholder="e.g. Telegram, Pixeldrain"
                          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Video Format (Optional)</label>
                        <input 
                          type="text" 
                          value={option.videoType || ''} 
                          onChange={(e) => updateVideoOption(option.id, 'videoType', e.target.value)}
                          placeholder="e.g. WEBRip, BluRay"
                          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">File Size (Optional)</label>
                        <input 
                          type="text" 
                          value={option.videoSize || ''} 
                          onChange={(e) => updateVideoOption(option.id, 'videoSize', e.target.value)}
                          placeholder="e.g. 1.5 GB"
                          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Extra Details (Optional)</label>
                        <input 
                          type="text" 
                          value={option.additionalDetails || ''} 
                          onChange={(e) => updateVideoOption(option.id, 'additionalDetails', e.target.value)}
                          placeholder="e.g. 10-bit, x265"
                          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">URL</label>
                      <input 
                        type="text" 
                        value={option.url} 
                        onChange={(e) => updateVideoOption(option.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
INNER_EOF
sed -i -e '/<div className="space-y-4">/r insert.txt' src/components/EditSubtitleModal.tsx
