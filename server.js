const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Enable CORS
app.use(cors());

// Store active lobbies and players
const activeLobbies = new Map();
const connectedPlayers = new Map();

// Generate unique lobby codes
function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create a new lobby
function createLobby(hostId, hostName) {
    let lobbyCode;
    do {
        lobbyCode = generateLobbyCode();
    } while (activeLobbies.has(lobbyCode));

    const lobby = {
        code: lobbyCode,
        hostId: hostId,
        players: new Map(),
        createdAt: Date.now(),
        gameStarted: false
    };

    // Add host to lobby
    lobby.players.set(hostId, {
        id: hostId,
        name: hostName,
        position: { x: 0, y: 0.25, z: 0 },
        rotation: 0,
        color: 0x3498db,
        isHost: true
    });

    activeLobbies.set(lobbyCode, lobby);
    console.log(`Created lobby ${lobbyCode} by ${hostName}`);
    return lobby;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Store player info
    connectedPlayers.set(socket.id, {
        id: socket.id,
        lobbyCode: null,
        name: `Player${Math.floor(Math.random() * 1000)}`
    });

    // Create lobby
    socket.on('createLobby', (playerName) => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            player.name = playerName || player.name;
            const lobby = createLobby(socket.id, player.name);
            player.lobbyCode = lobby.code;
            
            socket.join(lobby.code);
            socket.emit('lobbyCreated', {
                code: lobby.code,
                players: Array.from(lobby.players.values())
            });
            
            console.log(`Lobby ${lobby.code} created by ${player.name}`);
        }
    });

    // Join lobby
    socket.on('joinLobby', (data) => {
        const { lobbyCode, playerName } = data;
        
        // Convert to uppercase for case-insensitive lookup
        const normalizedLobbyCode = lobbyCode.toUpperCase();
        
        // Debug logging
        console.log('Join lobby request:', {
            originalCode: lobbyCode,
            normalizedCode: normalizedLobbyCode,
            playerName: playerName,
            currentLobbies: Array.from(activeLobbies.keys()),
            lobbyExists: activeLobbies.has(normalizedLobbyCode)
        });
        
        const lobby = activeLobbies.get(normalizedLobbyCode);
        
        if (!lobby) {
            console.log(`Lobby not found: ${normalizedLobbyCode}`);
            socket.emit('lobbyError', { message: 'Lobby not found' });
            return;
        }

        if (lobby.gameStarted) {
            console.log(`Game already started in lobby: ${normalizedLobbyCode}, allowing late join`);
            // Allow late joining but notify the player
            socket.emit('lateJoin', { 
                message: 'Game already started, joining as late player',
                players: Array.from(lobby.players.values())
            });
        }

        const player = connectedPlayers.get(socket.id);
        if (player) {
            player.name = playerName || player.name;
            player.lobbyCode = normalizedLobbyCode;

            // Add player to lobby
            lobby.players.set(socket.id, {
                id: socket.id,
                name: player.name,
                position: { x: 0, y: 0.25, z: 0 },
                rotation: 0,
                color: 0x3498db,
                isHost: false
            });

            socket.join(normalizedLobbyCode);
            
            // Notify all players in lobby
            io.to(normalizedLobbyCode).emit('playerJoined', {
                player: lobby.players.get(socket.id),
                allPlayers: Array.from(lobby.players.values())
            });

            console.log(`${player.name} joined lobby ${normalizedLobbyCode}`);
        }
    });

    // Start game
    socket.on('startGame', () => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            const lobby = activeLobbies.get(player.lobbyCode);
            if (lobby && lobby.hostId === socket.id) {
                lobby.gameStarted = true;
                io.to(player.lobbyCode).emit('gameStarted', {
                    players: Array.from(lobby.players.values())
                });
                console.log(`Game started in lobby ${player.lobbyCode}`);
            }
        }
    });

    // Player position update
    socket.on('playerUpdate', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            const lobby = activeLobbies.get(player.lobbyCode);
            if (lobby && lobby.players.has(socket.id)) {
                // Update player data
                const playerData = lobby.players.get(socket.id);
                playerData.position = data.position;
                playerData.rotation = data.rotation;
                playerData.speed = data.speed;
                playerData.isShooting = data.isShooting;
                if (data.name) {
                    playerData.name = data.name;
                }
                // Broadcast to other players in lobby, including name
                socket.to(player.lobbyCode).emit('playerMoved', {
                    id: socket.id,
                    position: data.position,
                    rotation: data.rotation,
                    speed: data.speed,
                    isShooting: data.isShooting,
                    name: playerData.name
                });
            }
        }
    });

    // Player shooting
    socket.on('playerShoot', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            socket.to(player.lobbyCode).emit('playerShot', {
                id: socket.id,
                bulletData: data
            });
        }
    });

    // Player hit deer
    socket.on('playerHitDeer', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            socket.to(player.lobbyCode).emit('deerHit', {
                id: socket.id,
                deerData: data
            });
        }
    });

    // Player hit player
    socket.on('playerHitPlayer', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            // Send to the specific target player
            const targetSocket = io.sockets.sockets.get(data.targetPlayerId);
            if (targetSocket) {
                targetSocket.emit('playerHit', {
                    id: socket.id,
                    damage: data.damage
                });
            }
            
            // Also broadcast to all players in the lobby
            socket.to(player.lobbyCode).emit('playerHit', {
                id: socket.id,
                targetPlayerId: data.targetPlayerId,
                damage: data.damage
            });
        }
    });

    // Player hit by deer
    socket.on('playerHitByDeer', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            // Send to the specific target player
            const targetSocket = io.sockets.sockets.get(data.targetPlayerId);
            if (targetSocket) {
                targetSocket.emit('deerHitPlayer', {
                    damage: data.damage
                });
            }
        }
    });

    // Player drift trail
    socket.on('playerDriftTrail', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            socket.to(player.lobbyCode).emit('otherPlayerDriftTrail', {
                id: socket.id,
                trailData: data
            });
        }
    });

    // Bot update (for deer and other bots)
    socket.on('botUpdate', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            socket.to(player.lobbyCode).emit('botUpdate', {
                botId: data.botId,
                position: data.position,
                rotation: data.rotation,
                isDead: data.isDead,
                isMoving: data.isMoving
            });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        const player = connectedPlayers.get(socket.id);
        if (player && player.lobbyCode) {
            const lobby = activeLobbies.get(player.lobbyCode);
            if (lobby) {
                lobby.players.delete(socket.id);
                
                // If no players left, remove lobby
                if (lobby.players.size === 0) {
                    activeLobbies.delete(player.lobbyCode);
                    console.log(`Lobby ${player.lobbyCode} removed (no players left)`);
                } else {
                    // If host left, assign new host
                    if (lobby.hostId === socket.id) {
                        const newHost = Array.from(lobby.players.keys())[0];
                        lobby.hostId = newHost;
                        const newHostData = lobby.players.get(newHost);
                        if (newHostData) {
                            newHostData.isHost = true;
                        }
                        io.to(player.lobbyCode).emit('newHost', { hostId: newHost });
                    }
                    
                    // Notify remaining players
                    io.to(player.lobbyCode).emit('playerLeft', {
                        id: socket.id,
                        allPlayers: Array.from(lobby.players.values())
                    });
                }
            }
        }
        
        connectedPlayers.delete(socket.id);
        console.log(`Player disconnected: ${socket.id}`);
    });

    // Get lobby info
    socket.on('getLobbyInfo', (lobbyCode) => {
        const normalizedLobbyCode = lobbyCode.toUpperCase();
        const lobby = activeLobbies.get(normalizedLobbyCode);
        if (lobby) {
            socket.emit('lobbyInfo', {
                code: lobby.code,
                players: Array.from(lobby.players.values()),
                gameStarted: lobby.gameStarted
            });
        } else {
            socket.emit('lobbyError', { message: 'Lobby not found' });
        }
    });

    // Get all active lobbies
    socket.on('getActiveLobbies', () => {
        const lobbies = Array.from(activeLobbies.values()).map(lobby => ({
            code: lobby.code,
            playerCount: lobby.players.size,
            gameStarted: lobby.gameStarted
        }));
        socket.emit('activeLobbies', lobbies);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeLobbies: activeLobbies.size,
        connectedPlayers: connectedPlayers.size,
        timestamp: new Date().toISOString()
    });
});

// Get server stats
app.get('/stats', (req, res) => {
    res.json({
        activeLobbies: Array.from(activeLobbies.keys()),
        lobbyCount: activeLobbies.size,
        playerCount: connectedPlayers.size,
        connectedPlayers: Array.from(connectedPlayers.values()).map(p => ({
            id: p.id,
            name: p.name,
            lobbyCode: p.lobbyCode
        }))
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Server stats: http://localhost:${PORT}/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}); 
