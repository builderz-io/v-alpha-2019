// Value Instrument Alpha | Version 0.2.0 | Apache 2.0 License | https://github.com/valueinstrument/vi-alpha

(function () {

// front-end functionality

   var socket = io();

   var dataset = [
       { name: 'elapsed', count: 0 },
       { name: 'remaining', count: 0 },
       { spendable: 0 }
   ];

   var headerRight = '';

   var windowHeight = $( window ).height();  // get device height to set pushy height
   $("#container").height(windowHeight);

   navigator.cookieEnabled ? Cookies.get("uPhrase") ? returningUser() : newUser() : $('#system-message').html('You must have Cookies enabled in your browser for this web app to function.');

   function returningUser() {

      socket.emit('returning user', Cookies.get("uPhrase"), function(callback) {
        if (callback === 1) {
          Cookies.remove('uPhrase');
          $('#system-message').html('Please register again. The app has been updated since your last visit.');
          $('#new-user-form').show();
          $('#user-name').attr('placeholder','Enter your preferred name');

        } else if (callback === 2) {
                $('#new-user-form').hide();
                $('#system-message').hide();
                $('#container').show();
                $('#textarea-form').show();
                $('#menu-button').show();
                autoScroll();

        } else {
          $('#system-message').html('Your unique phrase (saved as a cookie on your device) does not match. Contact the community admin.');

        }
      });
   }

   function newUser() {
      $('#new-user-form').show();
      $('#user-name').attr('placeholder','Enter your preferred name');
   }

   $('#new-user-form').submit(function(){

       var entry = $('#user-name').val(),
           niceName = forceNiceLookingName($('#user-name').val()),
           uPhrase = 'vx' + socket.id;

       socket.emit('new user', [niceName, uPhrase, entry], function(callback) {
         if (callback) {
               Cookies.set("uPhrase", uPhrase, { expires: 365 * 4 });
               $('#new-user-form').hide();
               $('#system-message').hide();
               $('#container').show();
               $('#textarea-form').show();
               $('#menu-button').show();
               autoScroll();

         } else {
           $('#system-message').html('Please choose another name. This one was taken or void. Must be within 2 to 12 letters.')
         }
       });
       $('#user-name').val('');
       return false;
   });

   function checkForTriggers(message) {
     var triggers = ['+', 'plus', 'pay', 'send', 'sent', 'sned', 'help', 'nukeme'];

     var messageParts = message.trim().toLowerCase().split(' ');

     if (messageParts[0].charAt(0) === '+') { messageParts.splice(1,0,messageParts[0].slice(1)); messageParts.splice(0,1,messageParts[0].charAt(0)); };
     if (messageParts[0].substring(0,3) === 'pay') { messageParts.splice(0,0,messageParts[0].substring(0,3)); messageParts.splice(1,1,messageParts[1].substring(3,messageParts[1].length)); };
     if (messageParts[0].substring(0,4) === 'send' || messageParts[0].substring(0,4) === 'plus' || messageParts[0].substring(0,4) === 'sned' || messageParts[0].substring(0,4) === 'sent' ) { messageParts.splice(0,0,messageParts[0].substring(0,4)); messageParts.splice(1,1,messageParts[1].substring(4,messageParts[1].length)); };

     if (triggers.indexOf(messageParts[0]) != -1) {
         return messageParts;
     } else { return false };
   }

   socket.on('set cookies', function(uPhrase) {
     Cookies.set("uPhrase", uPhrase, { expires: 365 * 4 });
     returningUser();
   });

   socket.on('chat message', function(data){

     $('#messages-ul li:last-child').attr('class') === "notification-container" ?
         newChatMessage(data) :
         $('#messages-ul li:last-child p:first-child span:first-child').html() === data.sender ?
            appendChatMessage(data) : newChatMessage(data);
            autoScroll();
   });

   function newChatMessage(data) {
     $('#messages-ul').append('<li class="message-container"></li>');
     $('#messages-ul li:last-child').html('<p class="message-sender"><span class="strong-weight">' + data.sender + '</span> <span class="time"> ' + moment(data.time).format('D MMM YYYY h:mm a') + '</span></p><p class="message-p">' + data.msg + '</p>');
   }

   function appendChatMessage(data) {
     $('#messages-ul li:last-child').append('<p class="message-p">' + data.msg + '</p>');
   }

   socket.on('chat history', function(docs, callback){

     $('#messages-ul').html('');

     newChatMessage(docs[0]);

    for (i = 1; i < docs.length; i++) {
      docs[i].sender === docs[i - 1].sender ? appendChatMessage(docs[i]) : newChatMessage(docs[i]);
    }

    callback(true);

    autoScroll();


   });

   socket.on('chat notification', function(data){

    $('#messages-ul').append('<li class="notification-container"><p>' + data.symbol + ' ' + data.msg + '</p><p class="time-right">' + moment().format('D MMM YYYY h:mm a') + '</p></li>');
    autoScroll();

   });

   socket.on('name in header', function(name) {
     $('#user-in-header').html(name[0]);
     $('#header-right').html(name[1]);
     headerRight = name[1];
     $('title').html(name[1] + ' - Value Alpha');
   });

   socket.on('transaction received', function() {
     playSound();
   });

   /* socket.on('burn info message', function(msg){
     $('#messages').append($('<li>').html(msg.msg));
   }); */

   socket.on('user online list', function(users) {
     $('#user-online-list').html(users);
   });

   socket.on('user account data', function(data) {
     $('#spendable').html(data.spendable);
     $('#balance').html(data.balance);
     $('#rt0').html(data.rt0);
     $('#at0').html(data.at0);

     $('#spendable-in-header').html(data.spendable + ' <span class="v">V</span>');

     dataset[0].count = data.rt0;
     dataset[1].count = data.dt0 - data.rt0;
     dataset[2].spendable = data.spendable;

     $('#chart').empty();
     accountpie();
   });

   socket.on('disconnect', function() {

       $('#textarea-form').hide();
       $('#menu-button').hide();
       $('#spendable-in-header').hide();
       $('#disconnected-notification').show();

       autoScroll();

   });

   socket.on('nukeme', function() {

     Cookies.remove('uPhrase');
     $('body').html('<div id="system-message">Account removed. Reload the page to start over.');

   });


   function accountpie() {  // shout out to Abhisek via adeveloperdiary.com

     var total= dataset[2].spendable;

     var pie=d3.layout.pie()
             .value(function(d){return d.count})
             .sort(null);

     var w=240,h=240;

     var outerRadiusArc=w/3;
     var innerRadiusArc=70;
     var shadowWidth=5;

     var outerRadiusArcShadow=innerRadiusArc+1;
     var innerRadiusArcShadow=innerRadiusArc-shadowWidth;

     var color = d3.scale.ordinal()
      .range(['#6352B9', '#000000', '#B65480', '#D5735A', '#D7D9DA']);

     var svg=d3.select("#chart")
             .append("svg")
             .attr({
                 width:w,
                 height:h,
                 class:'shadow'
             }).append('g')
             .attr({
                 transform:'translate('+w/3+','+h/3+')'
             });


     var createChart=function(svg,outerRadius,innerRadius,fillFunction,className){

         var arc=d3.svg.arc()
                 .innerRadius(outerRadius)
                 .outerRadius(innerRadius);

         var path=svg.selectAll('.'+className)
                 .data(pie(dataset))
                 .enter()
                 .append('path')
                 .attr({
                     class:className,
                     d:arc,
                     fill:fillFunction
                 });

         path.transition()
                 .duration(0)
                 .attrTween('d', function(d) {
                     var interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                     return function(t) {
                         return arc(interpolate(-t));
                     };
                 });

         var chart={path:path,arc:arc};

         return chart;
     };

     var mainChart=createChart(svg,outerRadiusArc,innerRadiusArc,function(d,i){
         return color(d.data.name);
     },'path1');

     var shadowChart=createChart(svg,outerRadiusArcShadow,innerRadiusArcShadow,function(d,i){
         var c=d3.hsl(color(d.data.name));
         return d3.hsl((c.h+5), (c.s -.07), (c.l -.15));
     },'path2');


     //Add text

     function numberWithCommas(x) {
         return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
     }

     var addText= function (text,y,size) {
         svg.append('text')
                 .text(text)
                 .attr({
                     'text-anchor':'middle',
                     y:y+14
                 })
                 .style({
                     fill:'#41B787',
                     'font-size':size
                 });
     };

     var restOfTheData=function(){

         addText(function(){
             return numberWithCommas(total);
         },0,'40px');


     /*      addText(function(){
             return "Page View";
         },25,'10px'); */

     };

     setTimeout(restOfTheData,0);

   };

   function forceNiceLookingName(input) {
     var string = input.replace(/[^A-Za-z]+/g, '').trim().toLowerCase();
     return string.charAt(0).toUpperCase() + string.slice(1);
   }

   function autoScroll() {
     $('#container').animate({scrollTop: $('#container').get(0).scrollHeight}, 500);
   }

   function playSound() { // this is a beautiful sound composition by philipeachille

      var sineWave1 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 880, volume: 0.27 }
      });
      var sineWave2 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 440, volume: 0.9 }
      });
      var sineWave3 = new Pizzicato.Sound({
          source: 'wave',
          options: { type: 'sine', frequency: 659.255, volume: 0.62 }
      });

      var reverb = new Pizzicato.Effects.Reverb({
          time: 0.6,
          decay: 1.2,
          reverse: false,
          mix: 0.9
      });
      var tremolo = new Pizzicato.Effects.Tremolo({
          speed: 7,
          depth: 0.8,
          mix: 0.3
      });
      sineWave1.attack = 0.3;
      sineWave2.attack = 0.3;
      sineWave1.release = 2;
      sineWave2.release = 2;

      var group = new Pizzicato.Group([sineWave1, sineWave2, sineWave3]);

      group.addEffect(reverb);
      group.addEffect(tremolo);

      group.play();

      setTimeout(function() { group.stop() }, 100);

    }

// Pages

   $('#tx-history-btn').click(function(){
     openPage();
     socket.emit('tx history');
    });

   socket.on('tx history', function(data){

      /*  data = {
      date: ,
      from: ,
      to: ,
      for: ,
      senderFee: ,
      burned: ,
      tt0: ,
      credit: ,
      debit: ,
      spendable: ,
      chainBalance: ,
      }

      [{"_id":"5b79eb0abdf91c45bd172388",
      "name":"Peter",
      "txHistory":[
        {"_id":"5b79eb0abdf91c45bd172389","date":"2018-08-19T22:11:22.852Z","from":"Value","to":"Peter","for":"Welcome Balance","senderFee":0,"burned":0,"tt0":200,"credit":100,"debit":0,"spendable":66,"chainBalance":100},
        {"_id":"5b79eb0fbdf91c45bd17238c","date":"2018-08-19T22:11:27.533Z","from":"Value","to":"Peter","for":"Basic Income","senderFee":0,"burned":2,"tt0":195,"credit":10,"debit":0,"spendable":72,"chainBalance":108},
        {"_id":"5b79eb19bdf91c45bd17238d","date":"2018-08-19T22:11:37.537Z","from":"Value","to":"Peter","for":"Basic Income","senderFee":0,"burned":5,"tt0":185,"credit":10,"debit":0,"spendable":75,"chainBalance":113}
        ]
      }] */

       var table = document.createElement('TABLE'),
           tableBody = document.createElement('TBODY'),
           tableHead = document.createElement('THEAD');
           table.appendChild(tableHead);
           table.appendChild(tableBody);

       var thCells = ['&nbsp;', 'Date', '&nbsp;', 'Time', 'Who', 'Reference', '<span class="v">V</span>', '&nbsp;', 'Chain', 'Fee', 'Burn', 'Days'];
       var thCellClasses = ['tx-type', 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit align-right', 'tx-v-sign', 'tx-balance align-right', 'tx-fee align-right hide-cell', 'tx-burned align-right hide-cell', 'tx-tt0 align-right hide-cell'];
       var thRow = tableHead.insertRow(0);

       for (var i=0; i<thCells.length; i++) {
         th = document.createElement('th');
         th.innerHTML = thCells[i];
         th.className = thCellClasses[i];
         thRow.appendChild(th);
       }

       for (var j=data.txHistory.length; j-- > 0;) {

         if (j >= 0 ) {

           var tx = data.txHistory[j];

           if (tx.senderFee === 0) {

             var cells = ['&#9673;',
                          moment(tx.date).format('D MMM'),
                          moment(tx.date).format('YY'),
                          moment(tx.date).format('hh:mm a'),
                          tx.from,
                          tx.for.charAt(0).toUpperCase() + tx.for.slice(1),
                          tx.credit,
                          '<span class="v">V</span>',
                          tx.chainBalance,
                          '',
                          tx.burned,
                          Math.floor(tx.tt0/60/60/24),
                         ];

             var cellClasses = ['tx-type green-text', 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number green-text align-right', 'tx-v-sign green-text', 'tx-balance straight-number align-right', 'tx-fee straight-number align-right hide-cell', 'tx-burned  straight-number align-right hide-cell', 'tx-tt0 straight-number align-right hide-cell'];

           } else {

             var cells = ['&#9673;',
                          moment(tx.date).format('D MMM'),
                          moment(tx.date).format('YY'),
                          moment(tx.date).format('hh:mm a'),
                          tx.to,
                          tx.for.charAt(0).toUpperCase() + tx.for.slice(1),
                          (tx.debit * -1),
                          '<span class="v">V</span>',
                          tx.chainBalance,
                          tx.senderFee,
                          tx.burned,
                          Math.floor(tx.tt0/60/60/24),
                        ];

             var cellClasses = ['tx-type red-text', 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number red-text align-right', 'tx-v-sign red-text', 'tx-balance straight-number align-right', 'tx-fee straight-number align-right hide-cell', 'tx-burned straight-number align-right hide-cell', 'tx-tt0 straight-number align-right hide-cell'];

           }

           var tr = tableBody.insertRow(tableBody.rows.length);

           for (var i=0; i<cells.length; i++) {
               var td = tr.insertCell(i);
               td.className = cellClasses[i];
               td.innerHTML = cells[i];
           };
         }
       };

     $('#header-right').html('Your Transactions');
     $('.page-pipe').html(table);

    });

   $('#profile-btn').click(function(){
     openPage();
     socket.emit('profile');
   });

   socket.on('profile', function(data){
     $('#header-right').html('Your Account');
     $('.page-pipe').html('You joined as ' + data.name + '. <br/><br/>Your karma in community participation is ' + data.profile.karma + ' of 10.<br/><br/>Your unique phrase is ' + data.uPhrase + '<br/><br/>Note this phrase down. It can recover your account and log you in on other devices.');
   });

   $('#location-btn').click(function(){
     openPage();
     $('#header-right').html('Offers & Locations');
     $('.page-pipe').html('<button id="add-location">Add</button><button id="search-location">Search</button>');
     $('#map').show();
   });

   $('#about-btn').click(function(){
     openPage();
     socket.emit('about community');
   });

   socket.on('about community', function(data){
     $('#header-right').html('Community Statistics');
     $('.page-pipe').html('You joined this community as ' + data.name );
   });

   $('#offline-btn').click(function(){
     openPage();
     $('#header-right').html('Go Offline');
     $('.page-title').html('Please Confirm');
     $('.page-pipe').html('<p class="notification-container">Your unique phrase is<br/><br/><span style="red-text">' + Cookies.get("uPhrase") + '</span><br/><br/></p><button id="go-offline">Yes, I noted it down</button><br/><br/><button id="cancel-offline">Cancel</button>');
   });

   // go offline
   $(document).on('click', '#go-offline', function(){
     socket.disconnect();
     $('body').html('<div id="system-message">You\'ve gone offline. Reload the page to start over.');
     Cookies.remove('uPhrase');
   });


   // close page
   $('.fa-times-circle').click(function(){
	   closePage()
	 });

   $(document).on('click', '#cancel-offline', function(){
     closePage()
   });

   function closePage() {
     $('#page').hide();
     $('#map').hide();
     $('#textarea-form').show();
     $('#menu-button').show();
     $('#header-right').html(headerRight);
     $('.page-title').html('');
   }

   // open page
   function openPage() {
     $('#textarea-form').hide();
     $('#menu-button').hide();
     $('#page').show();
   }


// disallow back button
   $(document).ready(function() {
           window.history.pushState(null, "", window.location.href);
           window.onpopstate = function() {
               window.history.pushState(null, "", window.location.href);
           };

   });

// Textareas - applied globally on all textareas with the "autoExpand" class
   $(document)
    .one('focus.autoExpand', 'textarea.autoExpand', function(){
        var savedValue = this.value;
        this.value = '';
        this.baseScrollHeight = this.scrollHeight;
        this.value = savedValue;
    })
    .on('input.autoExpand', 'textarea.autoExpand', function(){
        var minRows = this.getAttribute('data-min-rows')|0, rows;
        this.rows = minRows;
        rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 16);
        this.rows = minRows + rows ;
    });

    var input = document.getElementById("textarea-text");

    input.addEventListener("keyup", function(event) {
      event.preventDefault();
      if (event.keyCode === 13) {
        document.getElementById("textarea-button").click();
      }
    });

    $('#textarea-form').submit(function(){
      var message = $('#textarea-text').val().replace(/(\n)+/g,'');

      if (message.match(/[a-zA-Z0-9+]/) === null) {
            // no valid message was entered, so nothing happens
      } else {   // does message include trigger words?

        var messageParts = checkForTriggers(message);

        if (!messageParts) { // if message is good and no trigger word was detected, it is not a transaction, therefore just send message into chat

          socket.emit('chat message', message);

        } else {

          if (messageParts.length === 1 && messageParts[0] === 'help') {   // does message include trigger word "help"?

            $('#messages-ul').append('<li class="notification-container"><p>' + '&#9673;' + ' ' + 'Use "send", "pay" or "+" at the start of your message to trigger a transaction. Followed by one or several amounts and then one or several recipients. You can "send 15 to mary" or "send mary 15". In short enter "+15 mary". You can also add numbers by entering "+15 5 20 mary peter". This results in 40 being transferred to each, Mary and Peter. You can specify e.g. "for guitar lessons" at the very end of the message to include a reference. Try it now!' + '</p><p class="time-right">' + moment().format('D MMM YYYY h:mm a') + '</p></li>');
            autoScroll();

          } else if (messageParts[0] === 'nukeme'){
            socket.emit('nukeme');

          } else {
            socket.emit('transaction', messageParts);
          }
        }
      }

      $('#textarea-text').val('');
      $('#textarea-text').attr('rows','1');
      return false;
    });


}(jQuery));
