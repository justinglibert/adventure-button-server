import Datastore from "nedb";
import Skyscanner from "./lib/Skyscanner";
import moment from 'moment';

const service = new Skyscanner("ha599173816133981531838814122110");

const originPlace = "LOND-sky";

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
  result: { clicks: 0, city: { name: "You guys are fucking idiot", price: 1} }
};

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
            fromDate: moment(action.fromDate, 'DD/MM/YYYY'),
            toDate: moment(action.toDate,'DD/MM/YYYY')
          };
          oldState = internalState;
          getLocations(configureOptions.fromDate.format('YYYY-MM'), configureOptions.toDate.format('YYYY-MM'), configureOptions.budget)
          .then(locations => {
            playersDB.findOne({ _id: userId }, (err, player) => {
              serverLink.log("deb", player);
              internalState = {
                ...oldState,
                mode: "Join",
                players: [player],
                locations: locations
              };
              serverLink.log("deb", internalState);
              broadcast();
              resolve();
            });
          });
        }
        break;
      case "join": {
        playersDB.findOne({ _id: userId }, (err, player) => {
          internalState = {
            ...oldState,
            players: [...oldState.players, player]
          };
          broadcast();
          resolve();
        });
        break;
      }

      case "startGame": {
        // When host timer ends, force start game
        for (let player of internalState.players) {
          internalState.started.add(player._id);
        }
        internalState.mode = "Game";
        broadcast();
        resolve();
        break;
      }
      case "endGame": {
        let result = internalState.result;
        if (action.clicks > result.clicks) {
          internalState.result = {
            clicks: action.clicks,
            userId: userId,
            city: action.city
          };
        }
        internalState.started.delete(userId);
        if (internalState.started.size == 0) {

          let lowest = internalState.result.city.info;

          const ref_url = service.referral(lowest.OutboundLeg.Origin.SkyscannerCode, lowest.OutboundLeg.Destination.SkyscannerCode, lowest.OutboundLeg.DepartureDate, lowest.InboundLeg.DepartureDate)
          internalState.ref_url = ref_url;
          internalState.mode = "Result";
          broadcast();
          resolve();
        }
        break;
      }

      case 'reset':{
        internalState = {
          ...oldState,
          mode: 'Configure',
          started: new Set(),
          result: { clicks: 0, city: { name: "You guys are fucking idiot", price: 1} }
        };
        broadcast();
        resolve();
      }
      
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

function getLocations(inboundPartialDate, outboundPartialDate, maxPrice) {
  return new Promise((resolve, reject) => {
    serverLink.log('bows', outboundPartialDate);
    serverLink.log('bows', inboundPartialDate);
    service
      .browsequotes(
        originPlace,
        "anywhere",
        outboundPartialDate,
        inboundPartialDate
      )
      .then(res => {
        console.log(res.length());
        let listAcceptableFlights = [];

        for (let i = 0; i < res.length(); i++) {
          const result = res.row(i);

          if (result.OutboundLeg && result.InboundLeg) {
            if (result.Direct) {
              if (result.MinPrice <= maxPrice) {
                listAcceptableFlights = [...listAcceptableFlights, result];
              }
            }
          }
        }
        // const ref_url = service.referral(
        //   lowest.OutboundLeg.Origin.SkyscannerCode,
        //   lowest.OutboundLeg.Destination.SkyscannerCode,
        //   lowest.OutboundLeg.DepartureDate,
        //   lowest.InboundLeg.DepartureDate
        // );
        serverLink.log('damn', listAcceptableFlights);
        var flights = listAcceptableFlights.map((flight)=>{
          return {
            name: flight.OutboundLeg.Destination.Name,
            price: flight.MinPrice,
            info: flight
          }
        })
        flights.sort((a,b)=>{
          return b.price - a.price
        })

        flights = flights.slice(0,4);
        serverLink.log('damn', flights);

        resolve(flights);
      });
  });
}

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
      updateState(userId, json.payload).then(data => {
        server.log("action", userId + " sent an action");
        reply(
          JSON.stringify({
            data: {
              message: "Success",
              stat: internalState
            }
          })
        );
      });
    }
  });
}

export default createRoutes;
