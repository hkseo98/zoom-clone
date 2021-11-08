const express = require("express");
const http = require("http");
const ws = require("ws");

const sockets = [];

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/*", (req, res) => res.redirect("/"));

// http 서버와 ws 서버를 둘다 돌리는 방법
const server = http.createServer(app);
const wss = new ws.Server({ server });

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anon";
  socket.on("close", () => console.log("Disconnected from the Browser"));
  socket.on("message", (message) => {
    const parsed = JSON.parse(String(message));
    console.log(parsed.type);

    if (parsed.type === "message") {
      sockets.forEach((aSocket) =>
        aSocket.send(`${socket.nickname}: ${parsed.payload}`)
      );
    } else if (parsed.type === "nickname") {
      socket.nickname = parsed.payload;
    }
  });
});
server.listen(3000, () => console.log("Listening on localhost:3000"));
