import Datastore from "nedb";

var playersDB = new Datastore({ filename: "db/players.db", autoload: true });
var statesDB = new Datastore({ filename: "db/states.db", autoload: true });

var io;
var serverLink
var internalID;
var internalState = {
    state: 1
};

function updateState(userId, action) {
    //Update internalState HERE
    let oldState = internalState;
    internalState = {
        state: oldState.state + 1
    }

    serverLink.log('state', internalState);
    console.log(internalID);
    statesDB.update({_id: internalID}, internalState, {}, ()=>{});
    io.to('game').emit('state', internalState);
    return
}

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
    path: "/action",
    handler: function(request, reply) {
      //First get the player id
      let json = request.payload;
      let userId = json.userId;
      updateState(userId, json.action);
      server.log("action", userId + " sent an action");
      reply(
        JSON.stringify({
          data: {
            message: "Success"
          }
        })
      );
    }
  });
}

export default createRoutes;
