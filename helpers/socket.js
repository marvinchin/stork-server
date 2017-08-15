import socketio from "socket.io";

let io = null;

const userSocketMapping = {};
const socketUserMapping = {};

function handleSetUser(user, socket) {
  console.log(`${user} on ${socket}`);
  // If this socket is already mapped to this user, no need to add mappings
  if (socketUserMapping[socket.id] === user) {
    console.log("Already bound, no mappings added");
    return;
  }
  // If there is no sockets for this user, we add this key in the mapping
  if (!userSocketMapping[user]) {
    userSocketMapping[user] = [socket];
  } else {
    userSocketMapping[user] = [...userSocketMapping[user], socket.id];
  }
  // Each socket should only have on user, so we just update the socketUserMapping
  socketUserMapping[socket.id] = user;
  console.log("Mappings added for user");
}

function handleUnsetUser(socket) {
  console.log(`user unset from ${socket}`);
  const user = socketUserMapping[socket.id];
  // Remove the socket-user mapping for this socket
  socketUserMapping[socket.id] = null;
  if (!user) {
    return;
  }
  // Remove this socket from the user-socket mappings for this user
  const userSockets = userSocketMapping[user];
  const socketIndex = userSockets.indexOf(socket);
  if (socketIndex != -1) {
    userSockets.splice(socketIndex);
  }

  console.log(userSocketMapping);
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

export default io;
