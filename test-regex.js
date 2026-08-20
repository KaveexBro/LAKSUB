const html = `    <!-- Primary Title & Description -->
    <title>Sinhala Subtitles & Sinhala Sub | LAKSUB</title>
    <meta name="description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
    <meta name="keywords" content="Sinhala subtitle, Sinhala sub, English movie Sinhala subtitles, TV series Sinhala subtitles, Netflix Sinhala subtitles, LAKSUB, movie subtitle download" />`;

let result = html;
result = result.replace(/<title>.*?<\/title>/s, '');
result = result.replace(/<meta name="description"[^>]+>/gi, '');
result = result.replace(/<meta name="keywords"[^>]+>/gi, '');
console.log(result);
