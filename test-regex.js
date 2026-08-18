const html = `    <!-- Primary Title & Description -->
    <title>Sinhala Subtitles &amp; Sinhala Sub | LAKSUB</title>
    <meta name="description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
`;
const newTitle = 'Rick and Morty S01E01 Sinhala Subtitles';
const replaced = html.replace(/<title>.*?<\/title>/, `<title>${newTitle}</title>`);
console.log(replaced);
