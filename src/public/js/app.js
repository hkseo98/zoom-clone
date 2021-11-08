const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");

const socket = new WebSocket("ws://" + window.location.host);

socket.addEventListener("open", (m) => console.log(m.type));

socket.addEventListener("message", (m) => {
  const li = document.createElement("li");
  li.innerText = m.data;
  messageList.append(li);
});

socket.addEventListener("close", (m) => console.log(m));

messageForm.addEventListener("submit", handleSubmit);
function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(JSON.stringify({ type: "message", payload: input.value }));

  const li = document.createElement("li");
  li.innerText = `You: ${input.value}`;
  messageList.append(li);
  input.value = "";
}

nickForm.addEventListener("submit", handleNickSubmit);
function handleNickSubmit(event) {
  event.preventDefault();
  const input = nickForm.querySelector("input");
  socket.send(JSON.stringify({ type: "nickname", payload: input.value }));
  input.value = "";
}
