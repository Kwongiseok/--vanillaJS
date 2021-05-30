const socket = io.connect("http://localhost:8888");
var player;
var game;

function init() {
  const player1 = "white";
  const player2 = "black";

  // 채팅 관련
  const chatForm = document.getElementById("chat-form");
  const chatBox = document.getElementById("messages");

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = e.target.m.value;
    socket.emit("chat message", message);
    e.target.m.value = "";
    chatBox.appendChild(makeMessage(message, false));
  });

  socket.on("chat message", (message) => {
    chatBox.appendChild(makeMessage(message, true));
  });

  const makeMessage = (message, isOthers) => {
    const msgBox = document.createElement("div");
    const classname = isOthers
      ? "others-message-wrapper"
      : "my-message-wrapper";
    msgBox.className = classname;
    msgBox.innerText = message;
    return msgBox;
  };

  // 새로운 게임 생성
  $("#make-new-button").on("click", () => {
    const name = $("#userName1").val();
    if (!name) {
      alert("사용자의 닉네임을 입력해주세요!");
      return;
    }
    player = new Player(name, player1);
    socket.emit("createGame", { name });
  });

  // 방에 참여
  $("#enter-game-button").on("click", () => {
    const name = $("#userName2").val();
    const room = $("#roomId").val();

    if (!name || !room) {
      alert("접속할 방의 정보를 확인해주세요!");
      return;
    }
    player = new Player(name, player2);
    socket.emit("joinGame", { name, room });
  });

  // 엔터입력
  $("#userName1").keyup((e) => {
    if (e.which == 13) {
      $("#make-new-button").click();
    }
  });

  $("#roomId").keyup((e) => {
    if (e.which == 13) {
      $("#enter-game-button").click();
    }
  });

  $("#userName2").keyup((e) => {
    if (e.which == 13) {
      $("#enter-game-button").click();
    }
  });

  // 새로운 게임이 만들어짐
  socket.on("newGame", (data) => {
    const message = `안녕하세요 ${data.name}<br/> 게임 방 ID: 
        ${data.room}<br/> 참여자를 기다리고 있습니다...`;

    // 방만들어짐
    game = new Game(data.room);
    game.displayBoard(message);
  });

  // player1 접속했을 때
  socket.on("player1", (data) => {
    const message = `반갑습니다. ${player.getName()}`;
    $("#userHello").html(message);
    player.setMyTurn(false);
  });

  // player2 접속했을 때
  socket.on("player2", (data) => {
    const message = `반갑습니다. ${data.name}`;

    // player2 를 위한 게임
    game = new Game(data.room);
    game.displayBoard(message);
    player.setMyTurn(true);
  });

  // 턴 업데이트 과정
  socket.on("turnPlayed", (data) => {
    let row = game.getRow(data.tile);
    let col = game.getCol(data.tile);

    const opponentColor = player.getColor() === player1 ? player2 : player1;
    game.updateBoard(opponentColor, row, col, data.tile);
    player.setMyTurn(true);
  });

  // 게임 종료 메세지
  socket.on("gameEnd", (data) => {
    game.gameEnd(data.message);
  });

  // 에러 처리
  socket.on("err", (data) => {
    alert(data.message);
    location.reload();
  });

  socket.on("userDisconnect", () => {
    const message = `접속끊김 : 당신이 승리했습니다!!`;
    game.gameEnd(message);
  });
}

init();
