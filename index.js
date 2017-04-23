var http = require('http');
var sockjs = require('sockjs');

// https://github.com/MylesBorins/node-osc
var osc = require('node-osc');

var streams = {1: false, 2: false}

var sockServer = sockjs.createServer({
  sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' }
)

var oscServer = new osc.Server(2718, '0.0.0.0');

var getStreamData = function(msg) {
  const filePath = msg[1]
    .replace(/C6/, 'ö').replace(/C\$/, 'ä').replace(/C\(/, 'è')
  const stream = msg[2]
  const matches = filePath.match(/_(.+)_(.+)_(\d*)\./)

  if (matches && matches.length === 4) {
    const streamData = {
      recordist: matches[1],
      file: matches[2],
      stream: stream,
      soundcloudTrackId: matches[3] ? matches[3] : false
    }

    return streamData
  }

  return false
}

// We listen here to set streams so that when clients initially connect
// we can pass them existing stream info
oscServer.on("message", function(msg, rinfo) {
  var streamData = getStreamData(msg)

  if (streamData) {
    streams[streamData.stream] = streamData
  }
})

sockServer.on('connection', function(conn) {
  Object.keys(streams).sort().map(function(stream) {
    if (streams[stream]) {
      conn.write(JSON.stringify(streams[stream]))
    }
  })

  // We listen again to the same OSC message so that we can update existing
  // clients
  oscServer.on("message", function(msg, rinfo) {
    var streamData = getStreamData(msg)

    if (streamData) {
      conn.write(JSON.stringify(streamData))
    }
  })

  conn.on('close', function() {});
})

var server = http.createServer();
sockServer.installHandlers(server, {prefix:'/cm-data'});
server.listen(9999, '0.0.0.0');
