const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let players = {};
let foods = [];
let leaderboard = [];

let myId = null;

let mouse = {
    x: 0,
    y: 0
};

// BAĞLANTI
socket.on("connect", () => {

    myId = socket.id;

    const playerName = prompt("İsmin:") || "Oyuncu";

    socket.emit("setName", playerName);

});

// OYUN VERİLERİ
socket.on("updateGame", (data) => {

    players = data.players;
    foods = data.foods;
    leaderboard = data.leaderboard;

});

// MOUSE
document.addEventListener("mousemove", (e) => {

    mouse.x = e.clientX - canvas.width / 2;
    mouse.y = e.clientY - canvas.height / 2;

});

// GRID
function drawGrid(cameraX, cameraY){

    const gridSize = 50;

    ctx.strokeStyle = "#111";

    for(let x = -gridSize; x < canvas.width + gridSize; x += gridSize){

        ctx.beginPath();

        ctx.moveTo(
            x - (cameraX % gridSize),
            0
        );

        ctx.lineTo(
            x - (cameraX % gridSize),
            canvas.height
        );

        ctx.stroke();
    }

    for(let y = -gridSize; y < canvas.height + gridSize; y += gridSize){

        ctx.beginPath();

        ctx.moveTo(
            0,
            y - (cameraY % gridSize)
        );

        ctx.lineTo(
            canvas.width,
            y - (cameraY % gridSize)
        );

        ctx.stroke();
    }
}

// LEADERBOARD
function drawLeaderboard(){

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width - 220, 20, 200, 180);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText("Leaderboard", canvas.width - 190, 50);

    ctx.font = "16px Arial";

    leaderboard.forEach((player, index) => {

        ctx.fillText(
            `${index + 1}. ${player.name} (${player.score})`,
            canvas.width - 190,
            90 + index * 25
        );

    });

}

// ÇİZİM
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(!players[myId]){
        requestAnimationFrame(draw);
        return;
    }

    let me = players[myId];

    drawGrid(me.x, me.y);

    // YEMLER
    foods.forEach(food => {

        ctx.beginPath();

        ctx.arc(
            food.x - me.x + canvas.width/2,
            food.y - me.y + canvas.height/2,
            food.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = food.color;
        ctx.fill();

    });

    // OYUNCULAR
    for(let id in players){

        let p = players[id];

        let screenX = p.x - me.x + canvas.width / 2;
        let screenY = p.y - me.y + canvas.height / 2;

        ctx.beginPath();

        ctx.arc(
            screenX,
            screenY,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = p.color;

        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;

        ctx.fill();

        ctx.shadowBlur = 0;

        // İSİM
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            p.name,
            screenX,
            screenY - p.size - 10
        );

    }

    // SKOR
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";

    ctx.fillText(
        "Skor: " + Math.floor(me.score),
        20,
        40
    );

    drawLeaderboard();

    requestAnimationFrame(draw);
}

// HAREKET
function movePlayer(){

    socket.emit("move", {
        x: mouse.x * 0.003,
        y: mouse.y * 0.003
    });

    requestAnimationFrame(movePlayer);
}

movePlayer();
draw();