const express=require('express');
const app = express();
const path = require('path');
const indexRouter = require('./routes/index');
const http = require('http');
const socketIo = require('socket.io');
const server=http.createServer(app);
const io=socketIo(server);

// Socket.io setup

let waitingusers = [];
let rooms ={}

io.on('connection', (socket) => {
    // console.log('New user connected');
    socket.on('joinroom',function(){
        if(waitingusers.length > 0){
          let partner=waitingusers.shift();
          const roomname=`${socket.id}-${partner.id}`;
          socket.join(roomname);
          partner.join(roomname);
          io.to(roomname).emit("joined",roomname);

        }
        else{
            waitingusers.push(socket);
        }
    });
   
    socket.on('signalingmessage', function(data){
        // console.log(data);
        socket.broadcast.to(data.room).emit("signalingmessage",data);
    })

    socket.on("message", function(data){
        // console.log(data);
        socket.broadcast.to(data.room).emit("message",data.message);
    })

    socket.on("startVideoCall",function({room}){
        // console.log(room);  
        socket.broadcast.to(room).emit("incomingCall")
    })
    socket.on("acceptCall",function({room}){
        socket.broadcast.to(room).emit("callAccepted")
    })
    socket.on("rejectCall",function({room}){
        socket.broadcast.to(room).emit("callRejected")
    })

    socket.on('disconnect',function(socket){
        let index=waitingusers.findIndex(waitingUser=>waitingUser.id==socket.id);
        waitingusers.splice(index,1);
    });

});

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));

// Routes setup
app.use('/',indexRouter);

server.listen(process.env.PORT ||3000);
