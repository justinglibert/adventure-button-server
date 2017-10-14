import Datastore from "nedb";

var playersDB = new Datastore({ filename: "db/players.db", autoload: true });
var statesDB = new Datastore({ filename: "db/states.db", autoload: true });
var locationsDB = new Datastore({
    filename: "db/locations.db",
    autoload: true
});

statesDB.remove({}, { multi: true }, function(err, numRemoved) {});
locationsDB.remove({}, { multi: true }, function(err, numRemoved) {});
var io;
var serverLink;
var internalID;
var internalState = {
    locations: null,
    players: null,
    mode: "Configure",
    started: new Set(),  
    gameSpecific: null,
    drinkers : new Set(),
};
var gameModes = new Set(["HotCold","AnimalFight","Swiping"]);
var questions = new Set(["Question1","Question2","Question3"]);
var initTime = new Date();
var configureOptions = null;
function updateState(userId, action) {
    //Update internalState HERE
    let oldState = internalState;
    return new Promise(function(resolve, reject) {
	switch (action.name) {
	case "configure":
            {
		//Initial screen, configure budget and flight date. Moves to Join screen
		configureOptions = {
		    budget: action.budget,
		    fromDate: new Date(action.fromDate),
	            toDate: new Date(action.toDate)
		};
		oldState = internalState;
		playersDB.findOne({ _id: userId }, (err, player) => {
		    serverLink.log('deb',player);
		    internalState = {
			...oldState,
			mode: "Join",
			players: [player],
			locations: getLocations()
		    };
		    serverLink.log("deb", internalState);
		    broadcast();
		    resolve();
		});
            }
            break;
	case "join":
            {
		playersDB.findOne({ _id: userId }, (err, player) => {
		    internalState = {
			...oldState,
			players: [...oldState.players, player]
		    }
		    broadcast();
		    resolve();
		});
		break;
            }
            
            
	case "startGame":
            {
		// When host timer ends, force start game
		internalState = {
		    ...oldState,
		    mode : "Game"
		};
		for (player in oldState.players){
		    internalState.started.add(userId);
		}
		nextGame();
		broadcast();
		resolve();
		break;
            }
            
	case "nextMinigame":
            {
		// Counter, starts next game if all players click next
		internalState.started.add(userId);
		oldState = { ...internalState };
		updateLocations();
		if (internalState.started.size == internalState.players.length) {
		    nextGame();
		}
		broadcast();
		resolve();
		break;
            }
	    
	case "endMinigame":
            {
		// When the minigame has ended on client (i.e. selections made) maybe replaced
		internalState.started.delete(userId);
		oldState = { ...internalState };
		if (internalState.started.size == 0) {            
		    updateLocations();
		    
		    internalState = {
			...oldState,
			mode: "Resolution"
		    };
		}
		broadcast();
		resolve();
		break;
            }
            
	case "move":
            gameMove(userId, action.gameSpecific);
            break;
	}
    });
}
// true or false in game modes
function broadcast() {
    serverLink.log("state", internalState);
    console.log(internalID);
    statesDB.update({ _id: internalID }, internalState, {}, () => {});
    io.to("game").emit("state", internalState);
    return;
}
function nextGame() {
    let oldState = internalState
    let gameArray = [...gameModes];
    let chosenGame = gameArray[Math.floor(Math.random()*gameModes.size)]
    internalState = {...oldState,
		     mode :chosenGame
		    }
    if (gameMode != "Question") {
	gameModes.delete(gameMode);
    }
    else if (questions.size == 1) {
	gameModes.delete("Question")
    }
    gameInit();
}
function getQuestion(){
    let oldState = internalState
    let questionArray = [...questions];
    let chosenQuestion = questionArray[Math.floor(Math.random()*questions.size)]
    internalState = {...oldState,
		     gameSpecific : {...gameSpecific, question : chosenQuestion}
		    }
    gameModes.delete(chosenQuestion);
}

function getLocations() {
    return {};
}
function gameInit() {
    let oldState = internalState;
    switch (internalState.mode) {
    case
	"Question":{
	    internalState = {...oldState,
			     gameSpecific : {question : null, responses : new Map()}
			    };
	    getQuestion();
	    break;
	}
    }}	
function gameMove(userId, move) {
    let oldState = internalState;
    switch (internalState.mode) {
    case
	"Question":{
	    internalState.gameSpecific.responses.Set(userId,move);
	}
	break;
}

function updateLocations() {}
function createRoutes(shouldLoadState, server) {
    serverLink = server;
    io = require("socket.io")(server.listener);

    io.on("connection", function(socket) {
	console.log("New connection!");
	socket.join("game");
	socket.on("action", data => {
	    server.log("log", data);
	    updateState(data.userId, data.payload);
	    server.log("action", data.userId + " sent an action");
	});
    });

    if (shouldLoadState) {
	statesDB.findOne({}, function(err, state) {
	    if (state) {
		internalState = state;
		internalID = state._id;
		io.to("game").emit("state", internalState);
	    } else {
		statesDB.insert(internalState, (err, state) => {
		    internalID = state._id;
		});
		io.to("game").emit("state", internalState);
	    }
	});
    } else {
	statesDB.insert(internalState, (err, state) => {
	    internalID = state._id;
	});
    }
    server.route({
	method: "GET",
	path: "/",
	handler: function(request, reply) {
	    reply("Hello, world!");
	}
    });

    server.route({
	method: "POST",
	path: "/register",
	handler: function(request, reply) {
	    console.log(request.payload);
	    let json = request.payload;
	    playersDB.insert(
		{ name: json.name, createdAt: new Date(), drunkness: 0 },
		(err, response) => {
		    reply(JSON.stringify(response));
		}
	    );
	}
    });
    server.route({
	method: "GET",
	path: "/state",
	handler: function(request, reply) {
	    reply(JSON.stringify(internalState));
	}
    });
    server.route({
	method: "POST",
	path: "/player",
	handler: function(request, reply) {
	    playersDB.findOne({ _id: request.payload.userId }, function(err, doc) {
		reply(JSON.stringify(doc));
	    });
	}
    });

    server.route({
	method: "POST",
	path: "/action",
	handler: function(request, reply) {
	    //First get the player id
	    let json = request.payload;
	    let userId = json.userId;
	    updateState(userId, json.payload)
		.then((data) => {
		    server.log("action", userId + " sent an action");
		    reply(
			JSON.stringify({
			    data: {
				message: "Success",
				stat: internalState
			    }
			})
		    );
		})
	    
	}
    });
}

export default createRoutes;
