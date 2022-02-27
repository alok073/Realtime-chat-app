const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

//setup express
const app = express();

//setup an http server using express & pass it on to socket.io
const server = http.createServer(app);
const io = socketio(server);

//make files in public directory accessible to express
const publicDirPath = path.join(__dirname, '../public');
app.use(express.static(publicDirPath));

//This method runs everytime when a new client is connected
io.on('connection', (socket) => {
    console.log("New webSocket connection");

    //handle the 'join' event emitted by the client
    socket.on('join', (options, callback) => {
        const {error, user} = addUser({ id: socket.id, ...options });
        if(error) {
            return callback(error);
        }

        socket.join(user.room)

        //emit an event to the newly connected client
        socket.emit('message', generateMessage("Admin", "Welcome!!"));

        //emit a broadcast message to every client in the current room except the newly joined client
        const userMessage = `${user.username} has joined!`;
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", userMessage));

        //Send an event to all the users in the room also passing the list of users in that room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    //receive 'sendMessage' event from a client
    socket.on('sendMessage', (message, callback) => {
        //get the user object
        const user = getUser(socket.id);

        //apply filter for bad-words present in the message
        const filter = new Filter();
        if(filter.isProfane(message)) {
            return callback("Foul language is not allowed");
        }

        //send the received message to all the users in the room
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    //receive 'sendLocation' event from a client and send it to all the clients
    socket.on('sendLocation', (location, callback) => {
        //get user
        const user = getUser(socket.id);

        const locationUrl = `https://google.com/maps?q=${location.latitude},${location.longitude}`;

        //send the url to all the users in the room
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, locationUrl));
        callback();
    })

    //handle a 'disconnect' event....
    //when an user leaves a chat....send a braodcast to every other user in the room
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            //emit a 'message' event to all the users in the room
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left the chat`));

            //emit a 'roomData' to all the users in the room also passing the list of users inside the room
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

//connect to PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})