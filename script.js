const playersArea = document.getElementById("playersArea");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playBtn = document.getElementById("playBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const resultBox = document.getElementById("resultBox");
const history = document.getElementById("history");
const scoreBoard = document.getElementById("scoreBoard");
const multiplierInput = document.getElementById("multiplier");
const diceSound = document.getElementById("diceSound");

let players = [];
let gameHistory = [];
let scores = {};

// ユニークな名前かどうか判定
function isNameUnique(name, ignoreIndex = -1) {
  name = name.trim();
  if (!name) return false;
  let count = 0;
  for (let i = 0; i < players.length; i++) {
    if (players[i].name === name && i !== ignoreIndex) {
      count++;
      if (count > 0) return false;
    }
  }
  return true;
}

// プレイヤー追加関数
function addPlayer(name = "", choice = "丁", bet = 0) {
  const block = document.createElement("div");
  block.className = "player-block";

  block.innerHTML = `
    <input type="text" placeholder="名前" class="name name-input" value="${name}" />
    <select class="choice">
      <option value="丁" ${choice === "丁" ? "selected" : ""}>丁</option>
      <option value="半" ${choice === "半" ? "selected" : ""}>半</option>
    </select>
    <input type="number" min="0" class="bet" placeholder="掛金" value="${bet}" />
    <button class="remove">削除</button>
    <div class="error-message" style="display:none;"></div>
  `;

  // 名前重複チェック
  const nameInput = block.querySelector(".name-input");
  const errorMsg = block.querySelector(".error-message");

  function validateName() {
    updatePlayersArray();
    if (!isNameUnique(nameInput.value, Array.from(playersArea.children).indexOf(block))) {
      nameInput.classList.add("error");
      errorMsg.style.display = "block";
      errorMsg.textContent = "名前が重複しています";
      return false;
    } else {
      nameInput.classList.remove("error");
      errorMsg.style.display = "none";
      errorMsg.textContent = "";
      return true;
    }
  }

  nameInput.addEventListener("input", validateName);

  block.querySelector(".remove").onclick = () => {
    block.remove();
    updatePlayersArray();
    updateScoreBoard();
  };

  playersArea.appendChild(block);
  updatePlayersArray();
  validateName();
}

// プレイヤーリスト更新
function updatePlayersArray() {
  players = [];
  document.querySelectorAll(".player-block").forEach(block => {
    const name = block.querySelector(".name").value.trim() || "名無し";
    const choice = block.querySelector(".choice").value;
    const bet = parseFloat(block.querySelector(".bet").value) || 0;
    players.push({ name, choice, bet });
  });
}

// スコア初期化
function initScores() {
  scores = {};
  players.forEach(p => {
    if (!scores[p.name]) {
      scores[p.name] = { totalBet: 0, totalWin: 0 };
    }
  });
}

// スコアボード更新
function updateScoreBoard() {
  scoreBoard.innerHTML = "";
  for (const name in scores) {
    const card = document.createElement("div");
    card.className = "score-card";

    card.innerHTML = `
      <h3>${name}</h3>
      <p>掛金合計: <span class="editable bet" contenteditable="false">${scores[name].totalBet}</span></p>
      <p>勝ち額合計: <span class="editable win" contenteditable="false">${scores[name].totalWin}</span></p>
      <label class="edit-toggle">
        編集
        <input type="checkbox" />
      </label>
    `;

    // 編集ON/OFFでcontenteditable切り替え
    const checkbox = card.querySelector("input[type='checkbox']");
    const editableFields = card.querySelectorAll(".editable");

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        editableFields.forEach(e => {
          e.contentEditable = "true";
          e.classList.add("editable-active");
        });
      } else {
        editableFields.forEach(e => {
          e.contentEditable = "false";
          e.classList.remove("editable-active");
        });
      }
    });

    // 編集開始時に現在値保存
    editableFields.forEach(field => {
      field.addEventListener("focus", () => {
        field.previousContent = parseFloat(field.textContent);
      });
    });

    // 編集終了時アラート＆値更新
    editableFields.forEach(field => {
      field.addEventListener("blur", () => {
        if (!checkbox.checked) return;
        const newValue = parseFloat(field.textContent);
        if (isNaN(newValue) || newValue < 0) {
          alert("数値として正しい値を入力してください");
          // 元に戻す
          field.textContent = field.previousContent;
          return;
        }
        if (field.previousContent !== newValue) {
          alert(`スコアを修正しました: ${name}`);
        }
        field.previousContent = newValue;

        // 更新反映
        if (field.classList.contains("bet")) {
          scores[name].totalBet = newValue;
        } else if (field.classList.contains("win")) {
          scores[name].totalWin = newValue;
        }
      });
    });

    scoreBoard.appendChild(card);
  }
}

// 勝負実行
function playGame() {
  updatePlayersArray();

  // 名前重複チェック
  for (let i = 0; i < players.length; i++) {
    if (!isNameUnique(players[i].name, i)) {
      alert(`プレイヤー名「${players[i].name}」が重複しています。`);
      return;
    }
  }

  if (players.length === 0) {
    alert("プレイヤーを1人以上追加してください");
    return;
  }

  const multiplier = parseFloat(multiplierInput.value);
  if (isNaN(multiplier) || multiplier <= 0) {
    alert("倍率は正の数を入力してください");
    return;
  }

  // サイコロ2個の目をランダムに出す
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;

  // 偶数＝丁、奇数＝半
  const diceRoll = (total % 2 === 0) ? "丁" : "半";

  diceSound.currentTime = 0;
  diceSound.play();

  resultBox.textContent = `サイコロの目は ${dice1} と ${dice2}（合計 ${total}）なので、結果は「${diceRoll}」！`;

  // 勝敗判定・スコア加算
  players.forEach(p => {
    scores[p.name] = scores[p.name] || { totalBet: 0, totalWin: 0 };
    scores[p.name].totalBet += p.bet;
    if (p.choice === diceRoll) {
      const win = p.bet * multiplier;
      scores[p.name].totalWin += win;
    }
  });

  // 履歴に追加
  const record = {
    diceRoll,
    dice1,
    dice2,
    total,
    players: JSON.parse(JSON.stringify(players)),
    multiplier,
    timestamp: new Date().toLocaleString(),
  };
  gameHistory.push(record);

  updateScoreBoard();
  updateHistory();
}

// 履歴表示更新
function updateHistory() {
  if (gameHistory.length === 0) {
    history.innerHTML = "<p>まだ勝負の履歴はありません</p>";
    return;
  }

  let html = `<table><thead><tr><th>日時</th><th>出目</th><th>名前</th><th>掛金</th><th>選択</th><th>結果</th></tr></thead><tbody>`;

  gameHistory.forEach(game => {
    game.players.forEach(p => {
      const won = p.choice === game.diceRoll ? "勝ち" : "負け";
      html += `<tr>
        <td>${game.timestamp}</td>
        <td>${game.dice1} と ${game.dice2}（合計 ${game.total}） - ${game.diceRoll}</td>
        <td>${p.name}</td>
        <td>${p.bet}</td>
        <td>${p.choice}</td>
        <td>${won}</td>
      </tr>`;
    });
  });

  html += "</tbody></table>";
  history.innerHTML = html;
}

// 履歴クリア（スコアは保持）
function clearHistory() {
  gameHistory = [];
  updateHistory();
}

// イベント登録
addPlayerBtn.addEventListener("click", () => addPlayer());
playBtn.addEventListener("click", playGame);
clearHistoryBtn.addEventListener("click", clearHistory);

// 初期処理
//addPlayer();
initScores();
updateScoreBoard();
updateHistory();
const downloadTsvBtn = document.getElementById("downloadTsvBtn");

function downloadHistoryAndScoreAsTSV() {
  if (gameHistory.length === 0) {
    alert("履歴がありません");
    return;
  }

  // 履歴ヘッダー
  let tsv = "【履歴】\n";
  tsv += "日時\t出目1\t出目2\t合計\t結果\t名前\t掛金\t選択\t勝敗\n";

  // 履歴データ
  gameHistory.forEach(game => {
    game.players.forEach(p => {
      const won = (p.choice === game.diceRoll) ? "勝ち" : "負け";
      tsv += `${game.timestamp}\t${game.dice1}\t${game.dice2}\t${game.total}\t${game.diceRoll}\t${p.name}\t${p.bet}\t${p.choice}\t${won}\n`;
    });
  });

  tsv += "\n【スコアボード】\n";
  tsv += "名前\t掛金合計\t勝ち額合計\n";

  // スコアボードのデータ
  for (const name in scores) {
    tsv += `${name}\t${scores[name].totalBet}\t${scores[name].totalWin}\n`;
  }

  // Blobでファイル作成
  const blob = new Blob([tsv], { type: "text/tab-separated-values" });
  const url = URL.createObjectURL(blob);

  // ダウンロード用リンクを作ってクリック
  const a = document.createElement("a");
  a.href = url;
  a.download = `history_and_scores_${new Date().toISOString().slice(0,10)}.tsv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
downloadTsvBtn.addEventListener("click", downloadHistoryAndScoreAsTSV);