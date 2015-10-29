// Enable this value to automatically start this javascript application - it requires the password to be hardcoded
// which isn't safe, however if you're running it on an internal system pointing to an internal server, then you may be forgiven :)
var autoStart = true;

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

    Skype.initialize({
        apiKey: 'SWX-BUILD-SDK',
    }, function (api) {
        Application = api.application;
        client = new Application();
    }, function (err) {
        log('some error occurred: ' + err);
    });

    log("Client Created");

    // when the user clicks the "Sign In" button
    $('#signin').click(function () {
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
             
            conversation.historyService.activityItems.added(function (newMsg) {
                if (newMsg.type() == 'TextMessage') {
                    var direction = newMsg.direction();
                    log(newMsg.sender.displayName() + ' : ' + newMsg.text() + '');

                    //look for a specific keyword in a message
                    if (newMsg.text().toLowerCase().indexOf("knock") != -1) {
                        log("Found keyword.");
                        conversation.chatService.sendMessage("Who's there?").then(function () {
                            log('Message sent.');
                            $('#startChat').hide();
                        }).then(null, function (error) {
                            log('Error:' + error);
                        });;
                    }

                    //display message in chat window
                    addChatMessage(direction, newMsg.sender.displayName(), newMsg.text());
                }
            });


        }).then(null, function (error) {
            // if either of the operations above fails, tell the user about the problem
            log(error || 'Oops, Something went wrong.');
            $('#signin').show()
        });
    });

    $('#add_bob').click(function () {
        log('Adding the participant bob@productivecorporation.com');
        conversation.addParticipant("sip:bob@productivecorporation.com").then(function () {
            log('Bob added!');
            $('#add_bob').hide();
        }).then(null, function (error) {
            log('Error:' + error);
        });
    });

    $('#add_ella').click(function () {
        log('Adding the participant ella@productivecorporation.com');
        conversation.addParticipant("sip:ella@productivecorporation.com").then(function () {
            log('Ella added!');
            $('#add_ella').hide();
        }).then(null, function (error) {
            log('Error:' + error);
        });
    });

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
        log('Starting chatService...');
        conversation.chatService.start().then(function () {
            log('chatService started!');
            $('#startChat').hide();
        }).then(null, function (error) {
            log('Error:' + error);
        });
    });

    $('#stopChat').click(function () {
        log('Stopping chatService...');
        conversation.chatService.stop().then(function () {
            log('chatService stopped.');
            $('#startChat').hide();
        }).then(null, function (error) {
            log('Error:' + error);
        });
    });

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