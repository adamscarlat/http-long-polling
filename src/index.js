var chatName;
$(document).ready(function() {
    //get chat name, register to chat and show the chat room
    $("#enter-chat").on('click', function() {
        var name = $("#login-box").val();
        chatName = name;
        registerToChat();
        $("#chat-login").hide();
        $("#chat-room").show();
    })

    //send message on click
    $("#send-message").on('click', function() {
        var message = $("#chat-box").val();
        sendMessage(message);
    })
})

/*
Send the chosen chat name to server and start long-polling upon response. 
*/
function registerToChat() {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "http://localhost:9999/chat-login",
        data: JSON.stringify({name: chatName}),
        success: function(res) {
            $("#chat-messages").append(res + "\n");
            startLongPolling();
        }
    });
}

/*
Send a long-polled request. This request will get its response only when a new message
arrives to the chat server. When it receives its response, it calls itself again. 
This action simulates a bi-directional communication channel with the server.
*/
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

/*
Send a chat message
*/
function sendMessage(message) {
    $.ajax({
        type: "POST",
        contentType: 'application/json',
        url: "http://localhost:9999/chat-message",
        data: JSON.stringify({name: chatName, message: message}),
        success: function(res) {
            console.log(res);
        }
    });
}

