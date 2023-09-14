const io = require("socket.io")(8000, {
  cors: {
    origin: "*",
  },
});
function generateId(l = 10) {
  const s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return new Array(l).fill('_').map(() => {
    let e = s[Math.floor(Math.random() * s.length)];
    if (Math.random() < 0.5) {
      return e.toUpperCase();
    }
    return e;
  }).join('');
}
var users = {};
var meetings = {};
io.on("connection", (socket) => {
  // socket.on("meeting", (roomId, userId) => {
  //   socket.join(roomId);
  //   console.log(roomId);
  //   console.log(userId);
  //   socket.broadcast.emit("user-joined-meeting", userId);
  // });

  socket.on("start-meeting", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("new", name);
    const meetingCode = generateId();
    console.log(meetingCode)
    meetings[meetingCode] = { hostSocket: socket.id };
    socket.emit("meeting-started", meetingCode);
  });

  // Handle joining a meeting
  socket.on("join-meeting", (meetingCode) => {
    if (meetings[meetingCode]) {
      socket.emit("meeting-joined", meetingCode);
    } else {
      socket.emit("meeting-not-found", "Meeting not found");
    }
  });
  socket.on("meeting", (roomId, userId) => {
    socket.join(roomId);
    console.log(roomId);
    console.log(userId);
    socket.broadcast.emit("user-joined-meeting", userId);
  });

  socket.on("join", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("new", name);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("left", users[socket.id]);
    delete users[socket.id];
  });
  socket.on("send", (message) => {
    if (message.type == "text") {
      socket.broadcast.emit("message", {
        name: users[socket.id],
        message: message.msg,
        type: "text",
      });
    }
    if (message.type == "file") {
      socket.broadcast.emit("message", {
        name: users[socket.id],
        url: message.url,
        type: "file",
      });
    }
  });
});
