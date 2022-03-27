const express = require("express");
const axios = require("axios");
const app = express();

app.set("port", 4200);
app.set("view engine", "ejs");

app.listen(app.get("port"), () =>
  console.log("[server] http://localhost:" + app.get("port"))
);

app.use(express.static(__dirname + "/views"));

app.get("/", async function (req: any, res: any) {
  const api = await axios.get(`https://api.magicthegathering.io/v1/cards`);
  const data = api.data;

  let images: any[] = [];
  for (let index = 0; index < data.cards.length; index++) {
    for (let [key, value] of Object.entries(data.cards[index])) {
      if (key == "imageUrl") {
        images.push(value);
      }
    }
  }

  res.type("text/html");
  res.render("index", {
    image: images,
  });
});

app.get("/decks", (req: any, res: any) => {
  res.type("text/html");
  res.render("decks");
});

app.get("/draw", (req: any, res: any) => {
  res.type("text/html");
  res.render("draw");
});
