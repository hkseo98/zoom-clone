const express = require("express");
const { createServer } = require("http");
const { emit } = require("process");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/*", (req, res) => res.redirect("/"));

// http 서버와 ws 서버를 둘다 돌리는 방법
const httpServer = createServer(app);

// http://localhost:3000/admin으로 접속하면 된다.
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

httpServer.listen(3000, () => console.log("Listening on localhost:3000"));
