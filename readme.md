# Node Long Polling - A Proof of Concept

The purpose of this project is to understand http long-polling by implementing a (very) simple chat server and client.
It's for educational purposes only.

## Starting the App

Prerequisites: Node

1. Clone the repository
2. cd into the cloned repo directory
3. `npm install`
4. `node app.js`
5. In the browser goto localhost:9999

## Intro
Web based applications use the http protocol to exchange messages between the client and the server. The http protocol is 
good for the usual request-response cycle: a client asks for a resource using a URL and the server responds with
that resource. Any other requests will initiate a new request/response cycle.

In a chat application clients send messages to a server which emits those messages to any other connected clients.
In other words, the server is listening to incoming messages and so are the clients. Instead, of the usual 
unidirectional data flow from client to server, we have a bidirectional flow. The client are also listening to new 
messages that can arrive at any time.

Http long-polling allows us to emulate a duplex communication channel using the regular http request/response cycle.

Note: There are different ways to solve this problem nowadays. There is http2 which allows push notifications or web-sockets
which use a lower level communication channel. I chose to solve it using http long-polling in order to understand
the concept better. For a real chat-app, I would use one of the above mentioned solutions. For more information on available 
push technology: https://en.wikipedia.org/wiki/Push_technology

## Http Long-Polling
In http long-polling, the client usually sends an ajax request to the server in order to initiate the connection. With some 
cooperation from the server, the response to this request can be delayed and sent only when a certain condition is met (e.g. a new chat message).
When this condition fulfills, the response is sent back to the client. The client handles the response and immediatley 
sends a new long-polled request. The cycle continues. 

In this project, the client is a chat-app written in javascript and jQuery. The server is an app written in node and express.

When the chat client starts it initiates a long polled request using this function. Here we are the defining the listening state of the
client:

```
function startLongPolling() {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "http://localhost:9999/chat-longpoll",
        data: JSON.stringify({name: chatName}),
        success: function(res) {
            $("#chat-messages").append(res + "\n");
            startLongPolling();
        }
    });
}
```

We send an ajax request to the end-point http://localhost:9999/chat-longpoll on the server. Notice the `success` callback of this ajax request.
It handles the response data (appends the new chat message it received to some textarea) and immediatley calls itself again. Hence, it goes back to a 'listening' state
as soon as it finished handling the response.

What happens on the server?

On the server, we accept the long-polled request using this function:

```
var chatListenResponses = [];
app.post('/chat-longpoll', function(req, res) {
    chatListenResponses.push(res);
})
```

We take the incoming request and store its corresponding response in an array (more on this later). Important to notice here. We are not returning 
anything back to the client (yet). The client will not get a response at this point and if we open the chrome developer tools and look in the network tab, we'll
see that the request has a status of (pending).

A new chat message arrives, now what?

When a new chat message arrives, it's time to fulfill those long-polled requests. This piece of code simply responds to all of the pending requests, closes
them and clears the pending queue:

1. First we get a new chat message.
```
app.post('/chat-message', function(req, res) {
    var message = req.body.message;
    var name = req.body.name;
    emitMessage(name, message);
    res.end();
})
```

2. Then we emit it to all the pending requests:
```
function emitMessage(name, message) {
    chatListenResponses.forEach(res => {
        res.send(name + ": " + message);
        res.end();
    })
    chatListenResponses = [];
}
```

And this is it. For any questions feel free to send me a message. 


