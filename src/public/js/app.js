const socket = io();

const welcome = document.getElementById("welcome");
const roomnameForm = welcome.querySelector("#roomname");
const room = document.getElementById("room");
const title = document.querySelector("h1");
const nicknameForm = document.getElementById("name");
nicknameForm.addEventListener("submit", handleNicknameSubmit);
roomnameForm.addEventListener("submit", handleRoomSubmit);

room.hidden = true;

let roomName = "";
let nickname = "";

function showRoom(Num) {
  welcome.hidden = true;
  room.hidden = false;
  title.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  title.innerText = `Room ${roomName} (${Num})`;
}

function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = welcome.querySelector("#name input");
  socket.emit("nickname", input.value);
  nickname = input.value;
  input.value = "";
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");

  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${input.value}`);
    input.value = "";
  });
}

function handleRoomSubmit(event) {
  event.preventDefault();
  if (nickname === "") {
    alert("write your nickname");
    return;
  }
  const input = roomnameForm.querySelector("input");

  // 3번째 인자로 콜백함수를 전달할 수 있는데 이는 서버에서 실행할 수 있다.
  // 이 콜백함수는 서버의 socket.on 함수의 두번째 인자인 콜백함수의 두번째 인자로 들어온다.
  // 이뿐만 아니라 보내는 것에 대한 제한이 없다.. 텍스트, 숫자, 함수 등 여러개의 인자를 동시에 보낼 수 있다.
  // 함수는 마지막 인자로 한 번만 보낼 수 있다.
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;

  input.value = "";
}

socket.on("welcome", (nickname, newCount) => {
  addMessage(`${nickname} joined`);
  title.innerText = `Room ${roomName} (${newCount})`;
});

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

socket.on("bye", (nickname, newCount) => {
  title.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${nickname} left`);
});

socket.on("new_message", (msg) => {
  addMessage(msg);
});

socket.on("room_changed", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
  });
});
