var http = require('http');
var sockjs = require('sockjs');

// https://github.com/MylesBorins/node-osc
var osc = require('node-osc');


var sockServer = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });

var oscServer = new osc.Server(2718, '0.0.0.0');

sockServer.on('connection', function(conn) {
  oscServer.on("message", function (msg, rinfo) {
    const filePath = msg[1]
    const stream = msg[2]
    const matches = filePath.match(/_(.+)_(.+)_(\d*)\./)

    if (matches && matches.length === 3) {
      const streamData = {
        recordist: matches[1],
        file: matches[2],
        stream: stream,
        soundcloudTrackId: matches[3] ? matches[3] : false
      }

      conn.write(JSON.stringify(streamData))
    }
  });

  conn.on('close', function() {});
});

var server = http.createServer();
sockServer.installHandlers(server, {prefix:'/cm-data'});
server.listen(9999, '0.0.0.0');
