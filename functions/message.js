
const ChatDB = require('../db/messages');


exports = module.exports = function(io) {

  io.sockets.on('connection', function (socket) {

    socket.on('chat message', function(message) {

      var messageL = convertLinks(message);
      const date = Date.now(); // moment.unix(Date.now()/1000).format('D MMM YYYY h:mm a');

      new ChatDB({
        msg: messageL,
        sender: socket.user,
        senderTag: socket.userTag,
        time: date
      }).save(function(err) {
        if (err) { console.log(date + ' MongoDB Error - ' + err); }

        io.emit('chat message', {
          msg: messageL,
          sender: socket.user,
          senderTag: String(socket.userTag),
          time: date });
      });
    });

  });

  function convertLinks(text) {

    var link = text.match(/(?:www|https?)[^\s]+/g),
      aLink = [],
      repText = text;

    if (link != null) {

      for (let i=0;i<link.length;i++) {
        let replace;
        if (!( link[i].match(/(http(s?)):\/\//) ) ) { replace = 'http://' + link[i]; } else { replace = link[i]; }
        let linkText = replace.split('/')[2];
        if (linkText.substring(0,3) == 'www') { linkText = linkText.replace('www.',''); }
        aLink.push('<a href="' + replace + '" target="_blank">' + linkText + '</a>');
        repText = repText.split(link[i]).join(aLink[i]);
      }
      return repText;

    } else {
      return text;
    }
  }

};
