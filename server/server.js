// const express = require("express");
const mongoose = require("mongoose");
const Document = require("./models/Document");

mongoose
  .connect(
    "mongodb+srv://Sakthivel:Sakthivel612@cluster0.e915zlr.mongodb.net/google-docs?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    }
  )
  .then((db) => {
    console.log("DB connected");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
  });

const io = require("socket.io")(5000, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    // console.log(documentId); // documentId goted
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(document, { data });
    });
  });

  console.log("Connected");
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
