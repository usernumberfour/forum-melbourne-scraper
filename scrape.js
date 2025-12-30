import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import nodemailer from "nodemailer";

const URL = "https://forummelbourne.com.au/whats-on/";
const DATA_FILE = "artists.json";

async function scrapeArtists() {
  const response = await fetch(URL);
  const data = await response.text();
  const $ = cheerio.load(data);

  const artists = [];

  $(".event-card").each((_, el) => {
    const artist = $(el).find(".event-card__title").text().trim();
    const link = "https://forummelbourne.com.au" + $(el).find("a").attr("href");
    if (artist) artists.push({ artist, link });
  });

  return artists;
}

function loadPrevious() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveCurrent(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function sendEmail(newArtists) {
  const transporter = nodemailer.createTransport({
    host: "smtp.yandex.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log("Connecting to Yandex SMTP as:", process.env.EMAIL_USER);

  const htmlList = newArtists
    .map(a => `<li><a href="${a.link}">${a.artist}</a></li>`)
    .join("");

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "emailmeat@yandex.com",
      subject: "New Artists at Forum Melbourne",
      html: `<h2>New Artists Found</h2><ul>${htmlList}</ul>`
    });

    console.log("Email sent successfully:", info);
  } catch (err) {
    console.error("Email failed:", err);
  }
}

async function main() {
  const current = await scrapeArtists();
  const previous = loadPrevious();

  const prevNames = new Set(previous.map(a => a.artist));
  const newArtists = current.filter(a => !prevNames.has(a.artist));

  if (newArtists.length > 0) {
    console.log("New artists found:", newArtists);
    await sendEmail(newArtists);
  } else {
    console.log("No new artists this month.");
  }

  saveCurrent(current);
}

main();
