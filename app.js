const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var path = require('path');

app.use(express.static(path.join(__dirname, 'src')));
app.use(bodyParser.text({ type: 'text/*' }));
app.use(bodyParser.json());

//list of long-polled responses
var chatListenResponses = [];

/*
Initial login. Notifies all of the current chat clients that a new user joined.
*/
app.post('/chat-login', function(req, res) {
    var name = req.body.name;
    console.log('new chat client: ' + name);
    chatListenResponses.push(res);
    emitMessage('chat-server', 'new chat client - ' + name);
})

/*
Accepts an ajax request and stores its response in the array of long-polled
responses. The client that initiated this request will not get any response
for now (it will be in pending state).
*/
app.post('/chat-longpoll', function(req, res) {
    chatListenResponses.push(res);
})

/*
When a new chat message arrives, we use our long-polled responses 
that we collected. We send them the new message. Now the clients of these
messages will get their responses. 
*/
app.post('/chat-message', function(req, res) {
    var message = req.body.message;
    var name = req.body.name;
    emitMessage(name, message);
    res.end();
})

/*
Emit the new message to all the long-polled responses and clear the response array.
The client of these long-polled responses will initiate a new long-polled request 
immediatley as they get this response.

Note that we cannot recycle these responses. This is not some bi-directional communication
channel that can stay open. It only feels this way, this is still http request/response
type communication.
*/
function emitMessage(name, message) {
    chatListenResponses.forEach(res => {
        res.send(name + ": " + message);
        res.end();
    })
    chatListenResponses = [];
}

app.listen(9999, function () {
    console.log('Example app listening on port 9999!')
})