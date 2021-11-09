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

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {});
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done(countRoom(roomName));
    // 누군가 입장 해당 방의 모든 사람에게 웰컴 메시지를 보내고, 들어온 사람의 닉네임과 해당 방의 사이즈를 보내줌.
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    // 누군가 입장 시 모든 퍼블릭 방 목록 알려주기
    wsServer.sockets.emit("room_changed", publicRooms());
  });
  // disconnecting 이벤트를 통해 클라이언트가 서버와 연결이 끊어지기 전에 마지막 메시지를 보낼 수 있음
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    // 누군가 방을 떠나도 모든 퍼블릭 방 목록 알려주기
    // socket.io는 방에 아무도 없으면 방 삭제해줌.
    wsServer.sockets.emit("room_changed", publicRooms());
  });
  socket.on("new_message", (msg, roomName, done) => {
    socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => {
    socket.nickname = nickname;
  });
});

// WebSocket 사용시.
// const sockets = [];
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";
//   socket.on("close", () => console.log("Disconnected from the Browser"));
//   socket.on("message", (message) => {
//     const parsed = JSON.parse(String(message));
//     console.log(parsed.type);

//     if (parsed.type === "message") {
//       sockets.forEach((aSocket) =>
//         aSocket.send(`${socket.nickname}: ${parsed.payload}`)
//       );
//     } else if (parsed.type === "nickname") {
//       socket.nickname = parsed.payload;
//     }
//   });
// });

httpServer.listen(3000, () => console.log("Listening on localhost:3000"));
