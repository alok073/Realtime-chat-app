// Stores all the users object {id, username, room}
const users = []


/*
* Given an user object{id, username, room} perform sanity validations & check if the username is unique in a room or not.
* If username is unique push the user object into the users array..else return an error object
* Return the user object
*/
const addUser = ({ id, username, room }) => {
    //clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //validate the data
    if(!username || !room) {
        return {
            error: "Username & room are required!"
        }
    }

    //check for existing users
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    })
    if(existingUser) {
        return {
            error: "Username is in use!"
        }
    }
    const user = { id, username, room};
    users.push(user);
    
    return {user};
}


/*
* Given an user ID remove it from the users array and return the user object{id, username, room} of the removed user
*/
const removeUser = (id) => {
    //find the index in users array
    const index = users.findIndex((user) => {
        return user.id === id;
    })

    //If the user is found then return the user object of the removed user
    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
}


/*
* Given an user ID, get the user object{id, username, room} of that user
*/
const getUser = (id) => {
    const user = users.find((user) => {
        return user.id === id;
    })
    return user;
}


/*
* Given a room name, get an array containg objects of all the users in that room
*/
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    const userInRoom = users.filter((user) => {
        return user.room === room;
    })
    return userInRoom;
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
