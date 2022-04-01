const express = require("express");
const axios = require("axios");
const app = express();

app.set("port", 4200);
app.set("view engine", "ejs");

app.listen(app.get("port"), () =>
  console.log("[server] http://localhost:" + app.get("port"))
);

app.use(express.static(__dirname + "/views"));

app.get("/:func?", async function (req: any, res: any) {
  let link = req.params.func;
  let q = req.query.q;

  const api = await axios.get(`https://api.magicthegathering.io/v1/cards`);
  const data = api.data;

  let images: any[] = [];

  if (link == "search" && q != null) {
    for (let index = 0; index < data.cards.length; index++) {
      let values = Object.values(data.cards[index]);
      let keys = Object.keys(data.cards[index]);
      if (values.includes(q) || keys.includes(q)) {
        console.log(values);
        for (let [key, value] of Object.entries(data.cards[index])) {
          if (key == "imageUrl") {
            images.push(value);
          }
        }
      } else {
      }
    }
  } else {
    for (let index = 0; index < data.cards.length; index++) {
      for (let [key, value] of Object.entries(data.cards[index])) {
        if (key == "imageUrl") {
          images.push(value);
        }
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
