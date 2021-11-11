const socket = io();

const myFace = document.getElementById("myFace");
const Stream = document.getElementById("myStream");
const camerasSelect = document.getElementById("cameras");

Stream.hidden = true;

// global
let roomName = "";
let muted = false;
let cameraOff = false;
let myStream;
let myPeerConnection;

const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");

camerasSelect.addEventListener("input", handleCameraChange);

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", () => {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "mute";
    muted = false;
  }
});
cameraBtn.addEventListener("click", () => {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "camera On";
    cameraOff = true;
  }
});

async function getCameras() {
  try {
    // 유저가 사용할 수 있는 모든 디바이스 불러오는 함수
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: true,
    deviceId: { exact: deviceId },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// welcome Form(join a room)

const welcome = document.getElementById("welcome");

welcomeForm = welcome.querySelector("form");
welcomeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
});

async function initCall() {
  welcome.hidden = true;
  Stream.hidden = false;
  await getMedia();
  makeConnection();
}

// socket code
// 기존에 방에 있던 브라우저에서 실행되는 코드
socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});
// 새로 방에 입장한 브라우저에서 실행되는 코드.
// offer를 주고받아야 브라우저 간의 소통이 가능하다.
socket.on("offer", async (offer) => {
  console.log("recieve the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("recieved the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("recieved candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    //Stun Server by Google
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  //   console.log("got an event from my peer");
  //   const peerFace = document.getElementById("peerFace");
  //   peerFace.srcObject = data.stream;

  const peerFace = document.createElement("video");
  Stream.appendChild(peerFace);
  peerFace.playsInline = true;
  peerFace.srcObject = data.stream;
  peerFace.autoplay = true;
  peerFace.muted = true;
  peerFace.width = 300;
  peerFace.height = 300;
  console.log(peerFace);
}
