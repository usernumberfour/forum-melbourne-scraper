async function scrapeArtists() {
  const response = await fetch(URL);
  const data = await response.text();
  const $ = cheerio.load(data);

  console.log("Number of .show-item elements:", $(".show-item").length);

  const artists = [];

  $(".show-item").each((_, el) => {
    const artist = $(el).find(".title").text().trim();
    const link = $(el).attr("href");

    if (artist) {
      artists.push({
        artist,
        link
      });
    }
  });

  return artists;
}
