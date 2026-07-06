with open('src/pages/SeriesDetails.tsx', 'r') as f:
    content = f.read()

bad = """                    <AdZone zoneName="series-details" />
                  </div>
                )}
              </motion.div>"""

good = """                    <AdZone zoneName="series-details" />
                  </div>
                )}
              </motion.div>
              <div className="mt-4 px-6">
                <AdZone zoneName="series-details-middle" />
              </div>"""

content = content.replace(bad, good)
with open('src/pages/SeriesDetails.tsx', 'w') as f:
    f.write(content)
