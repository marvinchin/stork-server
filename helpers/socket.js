import socketio from "socket.io";

let io = null;

const socketUserMapping = {};

function handleSetUser(user, socket) {
  // If this socket is already mapped to this user, no changes to rooms
  // Otherwise, if socket is currently mapped to another user, we unset that user
  if (socketUserMapping[socket.id] === user) {
    console.log("Already mapped");
    return;
  } else if (!socketUserMapping[socket.id]) {
    handleUnsetUser(socket);
  }

  // We use the username as the room identifier
  socket.join(user);
  // Each socket should only have on user, so we just update the socketUserMapping
  socketUserMapping[socket.id] = user;
  console.log("Mappings added for user");
  io.in(user).clients((err, clients) => {
    console.log(clients);
  });
}

function handleUnsetUser(socket) {
  console.log(`user unset from ${socket}`);
  const user = socketUserMapping[socket.id];
  // Remove this connection from the room
  socket.leave(user);
  io.in(user).clients((err, clients) => {
    console.log(clients);
  });
}

function handleDisconnect(socket) {
  console.log(`Disconnecting ${socket.id}`);
  handleUnsetUser(socket);
}

export function initSocket(server) {
  console.log("Initializing Socket...");
  io = socketio(server);
  io.on("connection", socket => {
    console.log("Connected");
    socket.on("disconnect", () => handleDisconnect(socket));
    socket.on("set-user", user => handleSetUser(user, socket));
    socket.on("unset-user", () => handleUnsetUser(socket));
  });
}

export function sendEventToUser(user, event, data) {}

export default io;
