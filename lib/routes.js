import Datastore from 'nedb';

var playersDB = new Datastore({ filename: 'db/players.db', autoload: true });

function createRoutes(server) {
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply('Hello, world!');
        }
      });
      


    server.route({
        method: 'POST',
        path: '/add',
        handler: function (request, reply) {
        console.log(request.payload)
            let json = request.payload;
            playersDB.insert({name: json.name, createdAt: new Date()}, ()=>{});
            reply('Hello, ' + encodeURIComponent(json.name) + '!');
        }
    });
}

export default createRoutes;
