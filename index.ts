const express = require("express");
const axios = require("axios");
const app = express();

app.set("port", 4200);
app.set("view engine", "ejs");

app.listen(app.get("port"), () =>
  console.log("[server] http://localhost:" + app.get("port"))
);

app.use(express.static(__dirname + "/views"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: any, res: any) => {
  res.type("text/html");
  res.render("index");
});

app.get("/mtg", async function (req: any, res: any) {
  let images: any[] = [];
  let text: boolean = false;
  for (let index = 1; index < 3; index++) {
    const api = await axios.get(
      `https://api.magicthegathering.io/v1/cards?page=${index}`
    );
    const data = api.data;

    for (let index = 0; index < data.cards.length; index++) {
      for (let [key, value] of Object.entries(data.cards[index])) {
        if (key == "imageUrl") {
          let name = data.cards[index].name;
          let urlImage = value;

          let kaart = {
            name: name,
            url: urlImage,
          };

          images.push(kaart);
        }
      }
    }
  }

  res.type("text/html");
  res.render("home", {
    image: images,
    tekst: text,
  });
});

app.get("/mtg/zoeken", async function (req: any, res: any) {
  let search = req.query.search;

  const api = await axios.get(`https://api.magicthegathering.io/v1/cards`);
  const data = api.data;

  let images: any[] = [];
  let text: boolean = false;

  for (let index = 0; index < data.cards.length; index++) {
    let values = Object.values(data.cards[index]);
    let keys = Object.keys(data.cards[index]);
    if (values.includes(search) || keys.includes(search)) {
      if (data.cards[index].imageUrl != null) {
        images.push(data.cards[index].imageUrl);
      }
    }

    if (images.length == 0) {
      text = true;
    }
  }

  res.type("text/html");
  res.render("home", {
    image: images,
    tekst: text,
  });
});

app.get("/mtg/decks", (req: any, res: any) => {
  res.type("text/html");
  res.render("decks");
});

app.get("/mtg/draw", (req: any, res: any) => {
  res.type("text/html");
  res.render("draw");
});

function onClick(_src: string) {
  alert(_src);
}
