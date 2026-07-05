#!/bin/bash
cat << 'INNER_EOF' >> src/components/EditSubtitleModal.tsx
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description (Rich Text)</label>
                <div className="bg-white text-black rounded-md overflow-hidden">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-48 mb-12" />
                </div>
              </div>

              <div className="space-y-4 bg-black/30 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isProOnlyEdit" 
                    checked={isProOnly} 
                    onChange={e => setIsProOnly(e.target.checked)}
                    className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
                  />
                  <label htmlFor="isProOnlyEdit" className="text-sm font-medium text-gray-300">
                    Pro-Only Early Access
                    <span className="block text-xs text-gray-500 font-normal">Lock out Free Tier users temporarily to drive Pro conversions.</span>
                  </label>
                </div>

                {isProOnly && (
                  <div className="ml-8 pt-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Expiry Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required={isProOnly}
                      value={proOnlyUntil} 
                      onChange={e => setProOnlyUntil(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 italic">After this date, the subtitle will become available to everyone.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-black/30 p-4 rounded-lg border border-gray-800">
                <input 
                  type="checkbox" 
                  id="isAdultEdit" 
                  checked={isAdult} 
                  onChange={e => setIsAdult(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
                />
                <label htmlFor="isAdultEdit" className="text-sm font-medium text-gray-300">
                  Adult Content (18+)
                  <span className="block text-xs text-gray-500 font-normal">Mark this if the movie/series contains mature or adult content.</span>
                </label>
              </div>

              <div className="bg-black/30 p-4 rounded-lg border border-gray-800 space-y-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-netflix-red" /> Parents Guide
                </h3>
                
                {/* General Content Rating */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">General Content Rating</label>
                    <select 
                      value={parentalRating} 
                      onChange={e => setParentalRating(e.target.value)} 
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none text-sm"
                    >
                      {type === 'movie' ? (
                        <>
                          <option value="G">G - General Audiences</option>
                          <option value="PG">PG - Parental Guidance Suggested</option>
                          <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                          <option value="R">R - Restricted</option>
                          <option value="NC-17">NC-17 - Adults Only</option>
                        </>
                      ) : (
                        <>
                          <option value="TV-Y">TV-Y - All Children</option>
                          <option value="TV-Y7">TV-Y7 - Directed to Older Children</option>
                          <option value="TV-G">TV-G - General Audience</option>
                          <option value="TV-PG">TV-PG - Parental Guidance Suggested</option>
                          <option value="TV-14">TV-14 - Parents Strongly Cautioned</option>
                          <option value="TV-MA">TV-MA - Mature Audience Only</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">General Summary</label>
                    <input 
                      type="text" 
                      value={parentalDescription} 
                      onChange={e => setParentalDescription(e.target.value)} 
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none text-sm"
                      placeholder="e.g. Mild violence, language" 
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detailed Categories</h4>
                  {[
                    { label: 'Sex & Nudity', state: pgSexSeverity, setState: setPgSexSeverity, desc: pgSexDescription, setDesc: setPgSexDescription },
                    { label: 'Violence & Gore', state: pgViolenceSeverity, setState: setPgViolenceSeverity, desc: pgViolenceDescription, setDesc: setPgViolenceDescription },
                    { label: 'Profanity', state: pgProfanitySeverity, setState: setPgProfanitySeverity, desc: pgProfanityDescription, setDesc: setPgProfanityDescription },
                    { label: 'Alcohol, Drugs & Smoking', state: pgAlcoholSeverity, setState: setPgAlcoholSeverity, desc: pgAlcoholDescription, setDesc: setPgAlcoholDescription },
                    { label: 'Frightening & Intense Scenes', state: pgFrighteningSeverity, setState: setPgFrighteningSeverity, desc: pgFrighteningDescription, setDesc: setPgFrighteningDescription },
                  ].map((cat) => (
                    <div key={cat.label} className="space-y-3 pb-4 border-b border-gray-800 last:border-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-1/3">
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{cat.label}</label>
                          <select 
                            value={cat.state} 
                            onChange={e => cat.setState(e.target.value as any)} 
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white focus:border-white focus:outline-none text-sm"
                          >
                            <option value="None">None</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Brief Description</label>
                          <input 
                            type="text" 
                            value={cat.desc} 
                            onChange={e => cat.setDesc(e.target.value)} 
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white focus:border-white focus:outline-none text-sm"
                            placeholder={`Details about ${cat.label.toLowerCase()}...`} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
                <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-md font-bold transition-colors flex items-center gap-2">
                  {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
INNER_EOF
