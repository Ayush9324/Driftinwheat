<<<<<<< HEAD
# Multiplayer Driving Game

A real-time multiplayer 3D driving game built with Three.js, Socket.IO, and Node.js.

## Features

- **Real-time Multiplayer**: Players can create and join lobbies with unique 6-character codes
- **3D Driving Physics**: Realistic car physics with drifting mechanics
- **Interactive Environment**: Wheat fields, trees, mountains, and animated elements
- **Combat System**: Shoot at deer and avoid their spit attacks
- **Mobile Support**: Touch controls for mobile devices
- **Cross-platform**: Works on desktop and mobile browsers

## Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open the game:**
   - Navigate to `http://localhost:3000` in your browser
   - The game will automatically connect to the multiplayer server

### Development

For development with auto-restart:
```bash
npm run dev
```

## How to Play

### Single Player
1. Click "START DRIFTING" to begin
2. Use WASD or arrow keys to drive
3. Press SPACE to drift
4. Press X to shoot at the deer
5. Avoid deer spit attacks (-100 points)

### Multiplayer
1. Click "MULTIPLAYER" from the main menu
2. **Create a Lobby:**
   - Click "CREATE LOBBY"
   - Share the 6-character lobby code with friends
   - Click "START GAME" when ready
3. **Join a Lobby:**
   - Click "JOIN LOBBY"
   - Enter the 6-character lobby code
   - Click "JOIN GAME"

### Controls

**Desktop:**
- WASD or Arrow Keys: Drive
- SPACE: Drift
- X: Shoot
- Mouse: Look around (click to lock mouse)
- Q/E: Look left/right

**Mobile:**
- Touch controls on screen
- Drag to look around

## Server Endpoints

- `GET /health` - Server health check
- `GET /stats` - Server statistics
- `GET /` - Game client

## Deployment

### Render.com
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Set environment variable: `PORT=10000`

### Railway
1. Connect your GitHub repository
2. Railway will automatically detect the Node.js app
3. Deploy with default settings

### Vercel
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set output directory: `.`
4. Add environment variable: `PORT=3000`

## Technical Details

### Client-Side
- **Three.js**: 3D graphics and physics
- **Socket.IO Client**: Real-time communication
- **Vanilla JavaScript**: Game logic and UI

### Server-Side
- **Node.js**: Runtime environment
- **Express**: Web server
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Multiplayer Features
- **Lobby System**: Create and join game sessions
- **Real-time Sync**: Player positions, rotations, and actions
- **Event Broadcasting**: Shooting, deer hits, and game state
- **Connection Management**: Automatic cleanup on disconnect

### Performance Optimizations
- **Update Throttling**: Position updates every 50-100ms
- **Smooth Interpolation**: Client-side position smoothing
- **Efficient Rendering**: Optimized for mobile devices
- **Memory Management**: Automatic cleanup of disconnected players

## Troubleshooting

### Common Issues

1. **Server won't start:**
   - Check if port 3000 is available
   - Try a different port: `PORT=3001 npm start`

2. **Can't connect to multiplayer:**
   - Ensure server is running
   - Check browser console for errors
   - Verify Socket.IO client is loaded

3. **Game is slow:**
   - Close other browser tabs
   - Check device performance
   - Reduce graphics settings in browser

### Debug Commands

Open browser console and run:
```javascript
// Check server connection
console.log('Socket connected:', socket?.connected);

// Check active lobbies
socket?.emit('getActiveLobbies');

// Check lobby info
socket?.emit('getLobbyInfo', 'YOUR_LOBBY_CODE');
```

## License

MIT License - feel free to use and modify as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Test with different browsers
=======
# Multiplayer Driving Game

A real-time multiplayer 3D driving game built with Three.js, Socket.IO, and Node.js.

## Features

- **Real-time Multiplayer**: Players can create and join lobbies with unique 6-character codes
- **3D Driving Physics**: Realistic car physics with drifting mechanics
- **Interactive Environment**: Wheat fields, trees, mountains, and animated elements
- **Combat System**: Shoot at deer and avoid their spit attacks
- **Mobile Support**: Touch controls for mobile devices
- **Cross-platform**: Works on desktop and mobile browsers

## Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open the game:**
   - Navigate to `http://localhost:3000` in your browser
   - The game will automatically connect to the multiplayer server

### Development

For development with auto-restart:
```bash
npm run dev
```

## How to Play

### Single Player
1. Click "START DRIFTING" to begin
2. Use WASD or arrow keys to drive
3. Press SPACE to drift
4. Press X to shoot at the deer
5. Avoid deer spit attacks (-100 points)

### Multiplayer
1. Click "MULTIPLAYER" from the main menu
2. **Create a Lobby:**
   - Click "CREATE LOBBY"
   - Share the 6-character lobby code with friends
   - Click "START GAME" when ready
3. **Join a Lobby:**
   - Click "JOIN LOBBY"
   - Enter the 6-character lobby code
   - Click "JOIN GAME"

### Controls

**Desktop:**
- WASD or Arrow Keys: Drive
- SPACE: Drift
- X: Shoot
- Mouse: Look around (click to lock mouse)
- Q/E: Look left/right

**Mobile:**
- Touch controls on screen
- Drag to look around

## Server Endpoints

- `GET /health` - Server health check
- `GET /stats` - Server statistics
- `GET /` - Game client

## Deployment

### Render.com
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Set environment variable: `PORT=10000`

### Railway
1. Connect your GitHub repository
2. Railway will automatically detect the Node.js app
3. Deploy with default settings

### Vercel
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set output directory: `.`
4. Add environment variable: `PORT=3000`

## Technical Details

### Client-Side
- **Three.js**: 3D graphics and physics
- **Socket.IO Client**: Real-time communication
- **Vanilla JavaScript**: Game logic and UI

### Server-Side
- **Node.js**: Runtime environment
- **Express**: Web server
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Multiplayer Features
- **Lobby System**: Create and join game sessions
- **Real-time Sync**: Player positions, rotations, and actions
- **Event Broadcasting**: Shooting, deer hits, and game state
- **Connection Management**: Automatic cleanup on disconnect

### Performance Optimizations
- **Update Throttling**: Position updates every 50-100ms
- **Smooth Interpolation**: Client-side position smoothing
- **Efficient Rendering**: Optimized for mobile devices
- **Memory Management**: Automatic cleanup of disconnected players

## Troubleshooting

### Common Issues

1. **Server won't start:**
   - Check if port 3000 is available
   - Try a different port: `PORT=3001 npm start`

2. **Can't connect to multiplayer:**
   - Ensure server is running
   - Check browser console for errors
   - Verify Socket.IO client is loaded

3. **Game is slow:**
   - Close other browser tabs
   - Check device performance
   - Reduce graphics settings in browser

### Debug Commands

Open browser console and run:
```javascript
// Check server connection
console.log('Socket connected:', socket?.connected);

// Check active lobbies
socket?.emit('getActiveLobbies');

// Check lobby info
socket?.emit('getLobbyInfo', 'YOUR_LOBBY_CODE');
```

## License

MIT License - feel free to use and modify as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Test with different browsers
>>>>>>> 3de36f64f28808ac26e98daf5090e8c46a16c901
- Verify server is running properly 