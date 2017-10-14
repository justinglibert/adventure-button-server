import Datastore from "nedb";

var playersDB = new Datastore({ filename: "db/players.db", autoload: true });
var statesDB = new Datastore({ filename: "db/states.db", autoload: true });
var locationsDB = new Datastore({ filename: "db/locations.db", autoload: true });

statesDB.remove({}, { multi: true }, function (err, numRemoved) {
});
locationsDB.remove({}, { multi: true }, function (err, numRemoved) {
});
var io;
var serverLink;
var internalID;
var internalState = {
    locations : null,
    players : null,
    mode : "Configure",
    started : 0,
    gameDependent : null
};
var initTime = new Date();
var configureOptions = null
function updateState(userId, action) {
    //Update internalState HERE
    let oldState = internalState;
    return new Promise(function (resolve, reject){
	switch (action.name) {
    case
	"configure" :{ //Initial screen, configure budget and flight date. Moves to Join screen
	    configureOptions = {
		budget : action.budget,
		date : new Date(action.dateString)
	    };
	    oldState = internalState;
	    playersDB.findOne({ _id: userId }, (err, player) => {
		//serverLink.log('deb',player);
	    internalState = {...oldState,
			     mode : "Join",
			     players : [player.data],
			     locations : getLocations()
			    };
		serverLink.log('deb',internalState)
		resolve()
	    });
	}
	break;
    case
	"join":{
	    playersDB.findOne({ _id: userId }, (err, player) => {
	    internalState = {...oldState,
			     players : [...oldState.players, player.data],
			    };
	    });}
	    resolve();
	break;
    case
	"startGame" :{ // When host timer ends, force start game
	    internalState = { ...oldState,
			      started : oldState.players.length(),
			    };
	    nextGame();
	}
	    resolve()
	break;
    case
	"nextMinigame" :{ // Counter, starts next game if all players click next
	internalState = {...oldState,
			 started : oldState.started + 1
			};
	oldState = {...internalState};
	    if (internalState.started == internalState.players.length()) {
		nextGame();
	    }
	}
	    resolve();
	break;
    case
	"endMinigame"  :{ // When the minigame has ended on client (i.e. selections made) maybe replaced
	internalState = {...oldState,
			 started : oldState.started - 1
			};
	oldState = {...internalState};
	if (internalState.started == 0) {
	    internalState = {...oldState,
			     mode : "nextGame"
			    };
	    updateLocations();
	}
	    
	}
	    resolve()
	break;
    case
	"move" :
	updateByMove(userID,action);
	break;
    }

    });
    	    

}

function broadcast(){
	
    serverLink.log('state', internalState);
    console.log(internalID);
    statesDB.update({_id: internalID}, internalState, {}, ()=>{});
    io.to('game').emit('state', internalState);
    return

}
function nextGame() {
    return "Game";
}
function getLocations() {
    return {};
}
function updateByMove(userId,action) {}
function updateLocations(){}
function createRoutes(shouldLoadState, server) {
  serverLink = server;
  io = require("socket.io")(server.listener);

  io.on("connection", function(socket) {
    console.log("New connection!");
    socket.join('game')
    socket.on("action", (data)=>{
        server.log('log', data)
        updateState(data.userId, data.action);
        server.log('action', data.userId + " sent an action");
    });
  });

  if(shouldLoadState) {
    statesDB.findOne({}, function (err, state) {
        if(state){
            internalState = state;
            internalID = state._id;
            io.to('game').emit('state', internalState);
        }
        else {
            statesDB.insert(internalState, (err, state)=>{
                internalID = state._id;
            })
            io.to('game').emit('state', internalState);
        }
    });
  } else {
      statesDB.insert(internalState, (err, state)=>{
          internalID = state._id;
      })
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
	    playersDB.findOne({ _id: request.payload.userId }, function (err, doc) {reply(JSON.stringify(doc))});
	}
    });
    
    server.route({
	method: "POST",
	path: "/action",
    handler: function(request, reply) {
      //First get the player id
      let json = request.payload;
      let userId = json.userId;
	updateState(userId, json.action)
	    .then(()) => {
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
