const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Tüm dış bağlantı biçimlerine ve Punycode isteklerine tam izin verir
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));

const players = {};
const foods = [];

// YEMLER
for (let i = 0; i < 300; i++) {

    foods.push({
        x: Math.random() * 4000,
        y: Math.random() * 4000,
        size: 6,
        color: `hsl(${Math.random() * 360},100%,50%)`
    });

}

io.on("connection", (socket) => {

    console.log("Bağlandı:", socket.id);

    // OYUNCU
    players[socket.id] = {
        x: Math.random() * 4000,
        y: Math.random() * 4000,
        size: 25,
        score: 0,
        color: `hsl(${Math.random() * 360},100%,50%)`,
        name: "Oyuncu"
    };

    // İSİM
    socket.on("setName", (name) => {

        if (players[socket.id]) {

            players[socket.id].name = name.substring(0, 12);

        }

    });

    // HAREKET
    socket.on("move", (data) => {

        let player = players[socket.id];

        if (!player) return;

        player.x += data.x;
        player.y += data.y;

        // HARİTA SINIRI
        player.x = Math.max(0, Math.min(4000, player.x));
        player.y = Math.max(0, Math.min(4000, player.y));

        // YEM YEME
        foods.forEach((food, index) => {

            let dx = player.x - food.x;
            let dy = player.y - food.y;

            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.size) {

                player.size += 0.3;
                player.score += 1;

                foods[index] = {
                    x: Math.random() * 4000,
                    y: Math.random() * 4000,
                    size: 6,
                    color: `hsl(${Math.random() * 360},100%,50%)`
                };
            }

        });

        // OYUNCU YEME
        for (let id in players) {

            if (id === socket.id) continue;

            let enemy = players[id];

            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;

            let distance = Math.sqrt(dx * dx + dy * dy);

            if (
                player.size > enemy.size + 5 &&
                distance < player.size
            ) {

                player.size += enemy.size * 0.2;
                player.score += 50;

                enemy.x = Math.random() * 4000;
                enemy.y = Math.random() * 4000;
                enemy.size = 25;
                enemy.score = 0;
            }

        }

    });

    // ÇIKIŞ
    socket.on("disconnect", () => {

        delete players[socket.id];

        console.log("Oyuncu çıktı");

    });

});

// OYUN GÜNCELLEME
setInterval(() => {

    const leaderboard = Object.values(players)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    io.emit("updateGame", {
        players,
        foods,
        leaderboard
    });

}, 1000 / 60);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("Server çalışıyor");

});