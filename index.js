const axios = require("axios");
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Register all commands BEFORE starting the app
app.command("/msb-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/msb-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/msb-ping - Check bot latency
/msb-catfact - Get a cat fact`
  });
});

app.command("/msb-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/msb-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});

app.command("/msb-anime", async ({ command, ack, respond }) => {
  await ack();

  const searchTerm = command.text?.trim();
  
  if (!searchTerm) {
    await respond({ text: "Usage: `/msb-anime <anime ID or title>`\nExample: `/msb-anime 1` or `/msb-anime Naruto`" });
    return;
  }

  try {
    let animeId = searchTerm;
    
    // If searchTerm is numeric, use it as ID; otherwise search by title
    if (isNaN(searchTerm)) {
      // Search for anime by title using a free API instead
      const searchResponse = await axios.get("https://api.jikan.moe/v4/anime", {
        params: {
          query: searchTerm,
          order_by: "score",
          sort: "desc",
          limit: 1
        }
      });

      if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
        await respond({ text: `No anime found for "${searchTerm}"` });
        return;
      }

      const anime = searchResponse.data.data[0];
      await respond({
        text: `🎌 *${anime.title}*\nType: ${anime.type}\nScore: ${anime.score}/10\nStatus: ${anime.status}\nURL: ${anime.url}`
      });
    } else {
      // Use Jikan API to get anime by ID
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
      const anime = response.data.data;

      await respond({
        text: `🎌 *${anime.title}*\nType: ${anime.type}\nScore: ${anime.score}/10\nStatus: ${anime.status}\nURL: ${anime.url}`
      });
    }
  } catch (err) {
    console.error("Anime API Error:", err.message);
    await respond({ text: `Failed to fetch anime data for "${searchTerm}". Check your spelling or try an anime ID number.` });
  }
});

// Start the app after all commands are registered
(async () => {
  await app.start();
  console.log("bot is running!");
})();