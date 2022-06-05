import { stringify } from "querystring";

const { MongoClient } = require("mongodb");
const uri: string =
  "mongodb+srv://bubbles:wYUdRX5ruBPE@maincluster.tbehy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useUnifiedTopology: true });

const express = require("express");
const axios = require("axios");
const app = express();

const url = require("url");

app.set("port", 3000);
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

app.get("/mtg", async (req: any, res: any) => {
  let images: any[] = [];
  let text: boolean = false;
  let succes: boolean = false;
  let maxAdd: boolean = false;
  let collections;
  if (req.query.cardAdd == "succes") {
    succes = true;
  }
  if (req.query.cardAdd == "maxAdd") {
    maxAdd = true;
  }
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

  try {
    await client.connect();

    const db = client.db("IT-Project");
    collections = await db.listCollections().toArray();
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  res.type("text/html");
  res.render("home", {
    image: images,
    tekst: text,
    collections: collections,
    succes: succes,
    maxAdd: maxAdd,
  });
});

app.get("/mtg/zoeken", async (req: any, res: any) => {
  let search = req.query.search;

  let images: any[10] = [];
  let text: boolean = false;
  let succes: boolean = false;
  let maxAdd: boolean = false;

  let collections;

  for (let index = 1; index < 3; index++) {
    const api = await axios.get(
      `https://api.magicthegathering.io/v1/cards?page=${index}`
    );
    const data = api.data;

    for (let index = 0; index < data.cards.length; index++) {
      let values = Object.values(data.cards[index]);
      let keys = Object.keys(data.cards[index]);

      if (
        inString(data.cards[index], search) ||
        values.includes(search) ||
        keys.includes(search)
      ) {
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
        text = false;
      }

      if (images.length == 0) {
        text = true;
      }
    }
  }

  try {
    await client.connect();

    const db = client.db("IT-Project");
    collections = await db.listCollections().toArray();
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  res.type("text/html");
  res.render("home", {
    image: images,
    succes: succes,
    maxAdd: maxAdd,
    tekst: text,
    collections: collections,
  });
});

app.get("/mtg/decks", async (req: any, res: any) => {
  let succes: boolean = false;
  let cardsArray: any[] = [];

  const backgroundImage: string = "../img/back-of-card.jpg";

  if (req.query.collectionCreated == "succes") {
    succes = true;
  }
  try {
    await client.connect();

    const db = client.db("IT-Project");
    const collections = await db.listCollections().toArray();

    for (let index = 0; index < collections.length; index++) {
      const coll = db.collection(collections[index].name);

      const cards = await coll.find({}).toArray();
      if (cards[0] == null) {
        cardsArray.push({
          title: collections[index].name,
          url: backgroundImage,
        });
      } else {
        cardsArray.push({ title: collections[index].name, url: cards[0].url });
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
  res.type("text/html");
  res.render("decks", {
    succes: succes,
    decks: cardsArray,
  });
});

app.get("/mtg/decks/:name", async (req: any, res: any) => {
  let collection = req.params.name;

  let succes: boolean = false;
  let maxAmount: boolean = false;
  let deleted: boolean = false;

  if (req.query.modified == "succes") {
    succes = true;
  } else if (req.query.modified == "maxAmount") {
    maxAmount = true;
  }

  let cards;

  try {
    await client.connect();

    const db = client.db("IT-Project");
    const coll = db.collection(collection);

    cards = await coll.find({}).toArray();
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
  res.type("text/html");
  res.render("oneDeck", {
    succes: succes,
    maxAmount: maxAmount,
    deleted: deleted,
    name: collection,
    cards: cards,
  });
});

app.post("/mtg/decks/modify", async (req: any, res: any) => {
  let title = req.body.titleForm;
  let collection = req.body.collection;
  let amount = req.body.amountCard;
  let func = req.body.functionForm;

  let sum: number = 0;
  let cards;

  let succes: boolean = false;
  let deleted: boolean = false;
  let maxAmount: boolean = false;
  try {
    await client.connect();

    const db = client.db("IT-Project");
    const coll = db.collection(collection);

    cards = await coll.find({}).toArray();

    if (func == "update") {
      for (let index = 0; index < cards.length; index++) {
        if (cards[index].name == title) {
          for (let index = 0; index < cards.length; index++) {
            sum = sum + parseInt(cards[index].amount);
          }

          if (sum + parseInt(amount) < 60) {
            await coll.updateOne(
              { _id: cards[index]._id },
              { $set: { amount: amount } }
            );
            succes = true;
          } else {
            maxAmount = true;
          }
        }
      }
    } else if (func == "delete") {
      for (let index = 0; index < cards.length; index++) {
        if (cards[index].name == title) {
          await coll.findOne({ _id: cards[index]._id });
          await coll.deleteOne({ _id: cards[index]._id });
          deleted = true;
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  if (succes) {
    res.redirect("/mtg/decks/" + collection + "?modified=succes");
  } else if (maxAmount) {
    res.redirect("/mtg/decks/" + collection + "?modified=maxAmount");
  } else if (deleted) {
    res.redirect("/mtg/decks/" + collection + "?modified=deleted");
  }
});

app.get("/mtg/draw", async (req: any, res: any) => {
  let collections;
  try {
    await client.connect();

    const db = client.db("IT-Project");
    collections = await db.listCollections().toArray();
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
  res.render("draw", {
    collections: collections,
  });
});

app.post("/mtg/createDeck", async (req: any, res: any) => {
  let deckname = req.body.deckname;
  let succes: boolean = false;
  try {
    await client.connect();
    const db = client.db("IT-Project");

    const allCollections = await db.listCollections().toArray();

    const found = allCollections.some(
      (collection: any) => collection.name === deckname
    );

    if (!found) {
      try {
        const newCollection = await db.createCollection(deckname);
        console.log("Added collection: " + deckname);
        succes = true;
      } catch (e) {}
    } else {
      console.log("Error: Already in collection");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  if (succes) {
    res.redirect("../mtg/decks?collectionCreated=succes");
  } else {
    res.redirect("../mtg/decks");
  }
});

app.post("/mtg/addCard", async (req: any, res: any) => {
  let collection = req.body.collections;
  let url = req.body.imgUrlForm;
  let title = req.body.titleForm;
  let amount = req.body.amountCard;
  let succes: boolean = false;
  let maxAmount: boolean = false;
  try {
    await client.connect();
    const db = client.db("IT-Project");
    const coll = db.collection(collection);

    const cards = await coll.find({}).toArray();

    for (let index = 0; index < cards.length; index++) {
      let sum = 0;
      sum += cards[index].amount;
      if (sum >= 60) {
        maxAmount = true;
      }
    }

    const found = cards.some((card: any) => card.name === title);
    if (!found) {
      try {
        await coll.insertOne({
          name: title,
          url: url,
          amount: parseInt(amount),
        });
        console.log("Added: -Deck:" + collection + " -Card:" + title);
        succes = true;
      } catch (e) {}
    } else {
      console.log("Error: Already in collection");
    }
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }

  if (succes) {
    res.redirect("../mtg?cardAdd=succes");
  } else if (maxAmount) {
    res.redirect("../mtg?cardAdd=maxAmount");
  } else {
    res.redirect("../mtg");
  }
});

const inString = (cards: object, search: string) => {
  let values = Object.values(cards);
  let string = String(values);
  if (values.indexOf(search) !== -1) return true;
  else if (string.includes(search)) return true;
  else return false;
};
