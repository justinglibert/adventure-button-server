"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _nedb = require("nedb");

var _nedb2 = _interopRequireDefault(_nedb);

var _Skyscanner = require("./lib/Skyscanner");

var _Skyscanner2 = _interopRequireDefault(_Skyscanner);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var service = new _Skyscanner2.default("ha599173816133981531838814122110");

var originPlace = "LOND-sky";

var playersDB = new _nedb2.default({ filename: "db/players.db", autoload: true });
var statesDB = new _nedb2.default({ filename: "db/states.db", autoload: true });
var locationsDB = new _nedb2.default({
  filename: "db/locations.db",
  autoload: true
});

statesDB.remove({}, { multi: true }, function (err, numRemoved) {});
locationsDB.remove({}, { multi: true }, function (err, numRemoved) {});
var io;
var serverLink;
var internalID;
var internalState = {
  locations: null,
  players: null,
  mode: "Configure",
  started: new Set(),
  result: { clicks: 0, city: { name: "You guys are fucking idiot", price: 1 } }
};

var initTime = new Date();
var configureOptions = null;
function updateState(userId, action) {
  //Update internalState HERE
  var oldState = internalState;
  return new Promise(function (resolve, reject) {
    switch (action.name) {
      case "configure":
        {
          //Initial screen, configure budget and flight date. Moves to Join screen
          configureOptions = {
            budget: action.budget,
            fromDate: (0, _moment2.default)(action.fromDate, 'DD/MM/YYYY'),
            toDate: (0, _moment2.default)(action.toDate, 'DD/MM/YYYY')
          };
          oldState = internalState;
          getLocations(configureOptions.fromDate.format('YYYY-MM'), configureOptions.toDate.format('YYYY-MM'), configureOptions.budget).then(function (locations) {
            playersDB.findOne({ _id: userId }, function (err, player) {
              serverLink.log("deb", player);
              internalState = _extends({}, oldState, {
                mode: "Join",
                players: [player],
                locations: locations
              });
              serverLink.log("deb", internalState);
              broadcast();
              resolve();
            });
          });
        }
        break;
      case "join":
        {
          playersDB.findOne({ _id: userId }, function (err, player) {
            internalState = _extends({}, oldState, {
              players: [].concat(_toConsumableArray(oldState.players), [player])
            });
            broadcast();
            resolve();
          });
          break;
        }

      case "startGame":
        {
          // When host timer ends, force start game
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = internalState.players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var player = _step.value;

              internalState.started.add(player._id);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          internalState.mode = "Game";
          broadcast();
          resolve();
          break;
        }
      case "endGame":
        {
          var result = internalState.result;
          if (action.clicks > result.clicks) {
            internalState.result = {
              clicks: action.clicks,
              userId: userId,
              city: action.city
            };
          }
          internalState.started.delete(userId);
          if (internalState.started.size == 0) {

            var lowest = internalState.result.city.info;

            var ref_url = service.referral(lowest.OutboundLeg.Origin.SkyscannerCode, lowest.OutboundLeg.Destination.SkyscannerCode, lowest.OutboundLeg.DepartureDate, lowest.InboundLeg.DepartureDate);
            internalState.ref_url = ref_url;
            internalState.mode = "Result";
            broadcast();
            resolve();
          }
          break;
        }

      case 'reset':
        {
          internalState = _extends({}, oldState, {
            mode: 'Configure',
            started: new Set(),
            result: { clicks: 0, city: { name: "You guys are fucking idiot", price: 1 } }
          });
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
  statesDB.update({ _id: internalID }, internalState, {}, function () {});
  io.to("game").emit("state", internalState);
  return;
}

function getLocations(inboundPartialDate, outboundPartialDate, maxPrice) {
  return new Promise(function (resolve, reject) {
    serverLink.log('bows', outboundPartialDate);
    serverLink.log('bows', inboundPartialDate);
    service.browsequotes(originPlace, "anywhere", outboundPartialDate, inboundPartialDate).then(function (res) {
      console.log(res.length());
      var listAcceptableFlights = [];

      for (var i = 0; i < res.length(); i++) {
        var result = res.row(i);

        if (result.OutboundLeg && result.InboundLeg) {
          if (result.Direct) {
            if (result.MinPrice <= maxPrice) {
              listAcceptableFlights = [].concat(_toConsumableArray(listAcceptableFlights), [result]);
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
      var flights = listAcceptableFlights.map(function (flight) {
        return {
          name: flight.OutboundLeg.Destination.Name,
          price: flight.MinPrice,
          info: flight
        };
      });
      flights.sort(function (a, b) {
        return b.price - a.price;
      });

      flights = flights.slice(0, 4);
      serverLink.log('damn', flights);

      resolve(flights);
    });
  });
}

function createRoutes(shouldLoadState, server) {
  serverLink = server;
  io = require("socket.io")(server.listener);

  io.on("connection", function (socket) {
    console.log("New connection!");
    socket.join("game");
    socket.on("action", function (data) {
      server.log("log", data);
      updateState(data.userId, data.payload);
      server.log("action", data.userId + " sent an action");
    });
  });

  if (shouldLoadState) {
    statesDB.findOne({}, function (err, state) {
      if (state) {
        internalState = state;
        internalID = state._id;
        io.to("game").emit("state", internalState);
      } else {
        statesDB.insert(internalState, function (err, state) {
          internalID = state._id;
        });
        io.to("game").emit("state", internalState);
      }
    });
  } else {
    statesDB.insert(internalState, function (err, state) {
      internalID = state._id;
    });
  }
  server.route({
    method: "GET",
    path: "/",
    handler: function handler(request, reply) {
      reply("Hello, world!");
    }
  });

  server.route({
    method: "POST",
    path: "/register",
    handler: function handler(request, reply) {
      console.log(request.payload);
      var json = request.payload;
      playersDB.insert({ name: json.name, createdAt: new Date(), drunkness: 0 }, function (err, response) {
        reply(JSON.stringify(response));
      });
    }
  });
  server.route({
    method: "GET",
    path: "/state",
    handler: function handler(request, reply) {
      reply(JSON.stringify(internalState));
    }
  });
  server.route({
    method: "POST",
    path: "/player",
    handler: function handler(request, reply) {
      playersDB.findOne({ _id: request.payload.userId }, function (err, doc) {
        reply(JSON.stringify(doc));
      });
    }
  });

  server.route({
    method: "POST",
    path: "/action",
    handler: function handler(request, reply) {
      //First get the player id
      var json = request.payload;
      var userId = json.userId;
      updateState(userId, json.payload).then(function (data) {
        server.log("action", userId + " sent an action");
        reply(JSON.stringify({
          data: {
            message: "Success",
            stat: internalState
          }
        }));
      });
    }
  });
}

exports.default = createRoutes;