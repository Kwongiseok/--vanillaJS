class Player {
  constructor(nickname, color) {
    this.nickname = nickname;
    this.color = color;
    this.myTurn = false; // 내 턴
    this.timeLimit = 20; // 턴 당 시간
  }

  setMyTurn(isTurn) {
    this.myTurn = isTurn;
    this.timeLimit = 20;
    const $turn__text = document.querySelector("#turn");
    const text = isTurn ? "유저의 턴 입니다." : "상대방의 턴을 기다리는 중...";
    $turn__text.textContent = text;
  }

  getName() {
    return this.nickname;
  }

  getColor() {
    return this.color;
  }

  getTime() {
    return this.timeLimit;
  }

  getMyTurn() {
    return this.myTurn;
  }
}
