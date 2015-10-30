function log(texttolog) {
    var d = new Date();
    var time = padLeft(d.getHours(), 2) + ":" + padLeft(d.getMinutes(), 2) + ":" + padLeft(d.getSeconds(), 2) + ":" + padLeft(d.getMilliseconds(), 3);
    $('#logging_box').prepend(time + ": " + texttolog + "<br>");
}
function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function firstName(name) {
    if (name.indexOf("@") != -1) {
        //log("email");
        //email address returned, lets jus't display the first part
        //to protect their privacy
        name = name.split("@")[0];
        if (name.indexOf(".") != -1) { name = name.split(".")[0]; }
        if (name.indexOf("_") != -1) { name = name.split("_")[0]; }
        if (name.indexOf("-") != -1) { name = name.split("-")[0]; }
    }
    else {
        //log("full");
        //full name was returned, let's just display their first name
        name = name.split(" ")[0];
    }
    return toTitleCase(name);
}

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function addChatMessage(direction, displayName, message) {
    var imageurl = "<img src='./images/noimage.png' width=32 height=32 />";
    if (displayName.indexOf("Bob") != -1) { imageurl = "<img src='./images/Bob.png' width=32 height=32 />"; }
    if (displayName.indexOf("Ella") != -1) { imageurl = "<img src='./images/Ella.png' width=32 height=32 />"; }

    var msgbox_style = "msgbox_incoming";
    if (direction != 'Incoming') {
        msgbox_style="msgbox_outgoing"
    }

    var newCard = "<p class='" + msgbox_style +"'>" + message + '</p>';
    var newChatline = "<div class='row' style='vertical-align:middle;'>";
    newChatline = newChatline + "<div class='col-md-2'>" + imageurl + "</div>";
    newChatline = newChatline + "<div class='col-md-7'>" + newCard + "</div>";
    newChatline = newChatline + "<div class='col-md-2'>" + formatAMPM(new Date()) + "</div>";
    newChatline = newChatline + "</div>";
    $('#chat_window').append(newChatline);
}

$(function () {
    'use strict';

    log("App Loaded");
    $('#chatfunctions').hide();

    var Application
    var client;
    var conversation;
    var conversation2;

    Skype.initialize({
        apiKey: 'SWX-BUILD-SDK',
    }, function (api) {
        Application = api.application;
        client = new Application();
        log("Client Created");
    }, function (err) {
        log('some error occurred: ' + err);
    });    

    // when the user clicks the "Sign In" button
    $('#signin').click(function () {
        sign_in();
    });
    function sign_in() {
        $('#signin').hide();
        log('Signing in...');
        // and invoke its asynchronous "signIn" method
        client.signInManager.signIn({
            username: $('#address').text(),
            password: $('#password').text()
        }).then(function () {
            log('Logged In Successfully');
            $('#loginbox').hide();
            $('#chatfunctions').show();
            //create a new conversation
            log("Creating a new Conversation");
            conversation = client.conversationsManager.createConversation();
            log("Ready");
        }).then(null, function (error) {
            // if either of the operations above fails, tell the user about the problem
            log(error || 'Oops, Something went wrong.');
            $('#signin').show()
        });
    }
   
    $('#send_message').click(function () {
        var the_message = $('#the_message').text();
        if (the_message != "") {
            log('Sending message: ' + the_message);
            conversation.chatService.sendMessage(the_message).then(function () {
                log('Message sent.');
                $('#startChat').hide();
            }).then(null, function (error) {
                log('Error:' + error);
            });;
        } else {
            log('<b><font color=red>Please enter a message to send!</font></b>');
        }
    });

    $('#startChat').click(function () {
        start_chat();
    });
    function start_chat(){
        log('Starting chatService...');
        conversation.chatService.start().then(function () {
            log('chatService started!');
            $('#startChat').hide();

            //Register a listener for incoming calls
            log("Setting up listener for new conversations");
            client.conversationsManager.conversations.added(function (conversation) {
                log("Conversation invitation received");
                if (conversation.chatService.accept.enabled()) {
                    // this is an incoming IM call
                    conversation.chatService.accept().then(function () {
                        log("Accepted conversation invitation");

                        // Add a listener for new messages
                        log("Setting up listener for new messages");
                        conversation.historyService.activityItems.added(function (newMsg) {
                            if (newMsg.type() == 'TextMessage') {
                                var direction = newMsg.direction();
                                if (direction == "Incoming") {
                                    var the_message = newMsg.text().toString().trim();
                                    if (the_message == '') {
                                        the_message = newMsg.html();
                                    }

                                    log(newMsg.sender.displayName() + ' : [' + the_message + ']');
                                    var forward_address = $('#forward_address').val();
                                    if (forward_address != '') {
                                        send_instant_message(forward_address, 'Message from: ' + newMsg.sender.id() + ', Message:' + the_message + '')
                                    }
                                }
                            }
                        });

                        // get the response message
                        var response_message = $('#response_message').val();
                        log("Sending back: " + response_message)
                        conversation.selfParticipant.chat.state.when('Connected', function () {
                            conversation.chatService.sendMessage(response_message).then(function () {
                                log('Message sent.');
                            }).then(null, function (error) {
                                log('Error sending response:' + error);
                            });;
                        });
                        
                    }).then(null, function (error) {
                        // failed to accept the invitation
                        log('Error accepting invitation:' + error);
                    });
                    
                }
            });

        }).then(null, function (error) {
            log('Error:' + error);
        });
    }

    function send_instant_message(forward_address, the_message) {
        log('Forwarding to: ' + forward_address);
        log('Forwarding message: ' + the_message);
        //create a new conversation
        log("Forwarding: Creating a new Conversation");
        conversation2 = client.conversationsManager.createConversation();
        log("Forwarding: Starting chatService");
        conversation2.chatService.start().then(function () {
            log('Forwarding: chatService started!');
            conversation2.addParticipant("sip:" + forward_address).then(function () {
                log(forward_address + ' added!');
                pause(1000);
                log('Forwarding: Sending message: ' + the_message);
                conversation2.chatService.sendMessage(the_message).then(function () {
                    log('Forwarding: Message sent!');
                    pause(1000);
                    conversation2.chatService.stop().then(function () {
                        log('Forwarding: chatService stopped.');
                    }).then(null, function (error) {
                        log('Forwarding: Error Stopping chatService:' + error);
                    });
                }).then(null, function (error) {
                    log('Forwarding: Error Sending Message:' + error);
                });
            }).then(null, function (error) {
                log('Forwarding: Error adding participant:' + error);
            });
        }).then(null, function (error) {
            log('Forwarding: Error starting chatService' + error);
        });
    }

    $('#stopChat').click(function () {
        stop_chat();
    });
    function stop_chat() {
        log('Stopping chatService...');
        conversation.chatService.stop().then(function () {
            log('chatService stopped.');
            $('#startChat').hide();
        }).then(null, function (error) {
            log('Error:' + error);
        });
    }

    // when the user clicks on the "Sign Out" button
    $('#signout').click(function () {
        // start signing out
        log("Signing Out");
        client.signInManager.signOut().then(
                //onSuccess callback
                function () {
                    // and report the success
                    log('Signed out');
                    $('#loginbox').show();
                    $('#signin').show();
                    $('#chatfunctions').hide();
                },
            //onFailure callback
            function (error) {
                // or a failure
                log(error || 'Cannot Sign Out');
            });
    });
});