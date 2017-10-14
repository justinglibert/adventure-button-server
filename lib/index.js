'use strict';

import Hapi from 'hapi';
import Good from 'good';
import createRoutes from './routes.js';

const server = new Hapi.Server();
server.connection({ port: 3030, host: 'localhost', routes: {cors: true} });


server.register({
  register: Good,
  options: {
      reporters: {
          console: [{
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{
                  response: '*',
                  log: '*'
              }]
          }, {
              module: 'good-console'
          }, 'stdout']
      }
  }
}, (err) => {

  if (err) {
      throw err; // something bad happened loading the plugin
  }

  server.start((err) => {

      if (err) {
          throw err;
      }
      server.log('info', 'Server running at: ' + server.info.uri);
  });
});

createRoutes(false, server);

