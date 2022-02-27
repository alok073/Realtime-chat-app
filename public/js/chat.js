const socket = io();

//DOM elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationUrlTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true});

/*
    Auto-scrolling functionality
*/
const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild;

    //height of the newMessage
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }  
}

/*
    Server Event handler for 'message' event
*/
socket.on('message' , (messageObject) => {
    console.log(messageObject);

    //render messages sent by the user
    const html = Mustache.render(messageTemplate, {
        username: messageObject.username,
        createdAt: moment(messageObject.createdAt).format('h:mm a'),
        message: messageObject.text
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

/*
    Server Event handler for 'locationMessage' event
*/
socket.on('locationMessage', (urlObject) => {
    console.log(urlObject);

    //render the url link
    const html = Mustache.render(locationUrlTemplate, {
        username: urlObject.username,
        url: urlObject.url,
        createdAt: moment(urlObject.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

/*
    Server Event handler for 'roomData' event
*/
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})

/*
    Event listner for message submit button
*/
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //disable the send button till the typed message is delivered
    $messageFormButton.setAttribute('disabled', 'disabled');

    //get the message entered by the user
    const message = e.target.elements.userMessage.value;

    //emit an event to the server
    socket.emit('sendMessage', message, (errorMessage) => {
        //enable the send button as the message is delivered and clear the text box and bring the cursor to the text box
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if(errorMessage) {
            return console.log(errorMessage);
        }
        console.log("Message delivered successfully!!");
    });
})

/*
    Event listner for 'Send Location' button
*/
$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert("Geolocation is not supported in your browser");
    }

    //disable the submit button till the time location is not delivered
    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            //enable the submit button as the location is delivered
            $sendLocationButton.removeAttribute('disabled');
            console.log("Location shared!!");
        })
    })
})

//Emit an event when user clicks on join
socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        //redirect user to the Join page again
        location.href = "/";
    }
})