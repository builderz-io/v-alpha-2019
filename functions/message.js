exports = module.exports = function(io) {

  const ChatDB = require('../db/messages');


  io.sockets.on('connection', function (socket) {

    socket.on('chat message', function(message) {

      var message = convertLinks(message),
          date = Date.now(); // moment.unix(Date.now()/1000).format('D MMM YYYY h:mm a');

      var newMsg = new ChatDB({
        msg: message,
        sender: socket.user,
        time: date
      }).save(function(err) {
        if (err) { console.log(date + ' MongoDB Error - ' + req + ' - ' + err); }

        io.emit('chat message', {msg: message, sender: socket.user, time: date });
      });
    });

  });

  function convertLinks(text) {

    var link = text.match(/(?:www|https?)[^\s]+/g),
        aLink = [],
        repText = text;

    if (link != null) {

      for (i=0;i<link.length;i++) {
        var replace;
        if (!( link[i].match(/(http(s?))\:\/\//) ) ) { replace = 'http://' + link[i]; } else { replace = link[i] };
        var linkText = replace.split('/')[2];
        if (linkText.substring(0,3) == "www") { linkText = linkText.replace('www.','') };
        aLink.push('<a href="' + replace + '" target="_blank">' + linkText + '</a>');
        repText = repText.split(link[i]).join(aLink[i]);
      }
      return repText

    } else {
      return text
    }
  }

}
