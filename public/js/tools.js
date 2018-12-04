

  function openPage() {
    $('#textarea-form').hide();
    $('#mn-btn-lb').hide();
    $('#menu-btn' ).prop( "checked", false );
    $('#site-overlay').fadeToggle();
    $('#site-overlay-2').fadeToggle();
    $('#page').show();
  }

  function toLocal(date) {
    // shout out to http://jsfiddle.net/simo/sapuhzmm/
    var local = new Date(date);
     // local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
     return local.toDateString() + ' - ' + local.toTimeString().slice(0, 5);
  }

  function forceNiceLookingName(input) {
    var string = input.replace(/[0-9\s]+/g, '').trim().toLowerCase();
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function sanitize(input) {
    return input.trim().replace(/(?:\r\n|\r|\n)/g, ' ').replace(/<[^>]+>/g, '');
  }

  function txHistoryTable(data) {

      var table = document.createElement('TABLE'),
          tableBody = document.createElement('TBODY'),
          tableHead = document.createElement('THEAD');
          table.appendChild(tableHead);
          table.appendChild(tableBody);
          table.className = 'tx-history-table';

      var thCells = [/*'&nbsp;',*/ strTxPg120, '&nbsp;', strTxPg130, strTxPg140, strTxPg150, '<span class="currency-unit">' + str10001 + '</span>', '&nbsp;', strTxPg160];
      var thCellClasses = [/*'tx-type',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit align-right', 'tx-v-sign', 'tx-balance align-right'];
      var thRow = tableHead.insertRow(0);

      if (!(data[2] == 0)) {
        thCells.push(strTxPg170);
        thCellClasses.push('tx-fee align-right hide-cell');
      }

      if (data[3]) {
        thCells.push(strTxPg180);
        thCellClasses.push('tx-burned align-right hide-cell');
      }

      if (data[4]) {
        thCells.push(data[5]);
        thCellClasses.push('tx-tt0 align-right hide-cell');
      }

      thCells.push(strTxPg190);
      thCellClasses.push('tx-initiator align-right hide-cell');

      for (var i=0; i<thCells.length; i++) {
        th = document.createElement('th');
        th.innerHTML = thCells[i];
        th.className = thCellClasses[i];
        thRow.appendChild(th);
      }

      for (var j=data[0].txHistory.length; j-- > 0;) {

        if (j >= 0 ) {

          var tx = data[0].txHistory[j],
             user = data[0].name,
             txD = toLocal(new Date(tx.date)).slice(4, 10),
             txY = toLocal(new Date(tx.date)).slice(11, 15),
             txT = toLocal(new Date(tx.date)).slice(18, 24);

          if (!(user == tx.from)) {

            var cells = [//'&#9673;',
                         txD,
                         txY,
                         txT,
                         tx.from,
                         tx.for,
                         tx.credit,
                         '<span class="currency-unit">' + str10001 + '</span>',
                         tx.chainBalance,
                        ];

            var cellClasses = [/*'tx-type confirm-text',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number confirm-text align-right', 'tx-v-sign confirm-text', 'tx-balance straight-number align-right'];

            if (!(data[2] == 0)) {
              cells.push('0');
              cellClasses.push('tx-fee straight-number align-right hide-cell');
            }

            if (data[3]) {
              cells.push(tx.burned);
              cellClasses.push('tx-burned straight-number align-right hide-cell');
            }

            if (data[4]) {
              cells.push(Math.floor(tx.tt0/data[1]));
              cellClasses.push('tx-tt0 straight-number align-right hide-cell');
            }

            cells.push(tx.initiator);
            cellClasses.push('tx-initiator align-right hide-cell');

          } else {

            var cells = [//'&#9673;',
                         txD,
                         txY,
                         txT,
                         tx.to,
                         tx.for,
                         (tx.debit * -1),
                         '<span class="currency-unit">' + str10001 + '</span>',
                         tx.chainBalance,
                       ];

            var cellClasses = [/*'tx-type alert-text',*/ 'tx-date', 'tx-date-y hide-cell', 'tx-date-hh hide-cell', 'tx-from', 'tx-for', 'tx-credit straight-number alert-text align-right', 'tx-v-sign alert-text', 'tx-balance straight-number align-right'];

            if (!(data[2] == 0)) {
              cells.push(tx.senderFee);
              cellClasses.push('tx-fee straight-number align-right hide-cell');
            }

            if (data[3]) {
              cells.push(tx.burned);
              cellClasses.push('tx-burned straight-number align-right hide-cell');
            }

            if (data[4]) {
              cells.push(Math.floor(tx.tt0/data[1]));
              cellClasses.push('tx-tt0 straight-number align-right hide-cell');
            }

            cells.push(tx.initiator);
            cellClasses.push('tx-initiator align-right hide-cell');

          }

          var tr = tableBody.insertRow(tableBody.rows.length);

          for (var i=0; i<cells.length; i++) {
              var td = tr.insertCell(i);
              td.className = cellClasses[i];
              td.innerHTML = cells[i];
          };
        }
      };
    return table
  }

  function convertArrayOfObjectsToCSV(args) { // credit to https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/
      var result, ctr, keys, columnDelimiter, lineDelimiter, data;

      console.log(args.data);

      data = args.data.reverse() || null;
      if (data == null || !data.length) {
          return null;
      }

      columnDelimiter = args.columnDelimiter || ',';
      lineDelimiter = args.lineDelimiter || '\n';

      keys = Object.keys(data[0]);

      result = '';
      result += keys.join(columnDelimiter);
      result += lineDelimiter;

      data.forEach(function(item) {
          ctr = 0;
          keys.forEach(function(key) {
              if (ctr > 0) result += columnDelimiter;

              result += item[key];
              ctr++;
          });
          result += lineDelimiter;
      });

      return result;
  }

  function downloadCSV(args) {
      var data, filename, link;

      var csv = convertArrayOfObjectsToCSV({
          data: args.data,
      });
      if (csv == null) return;

      filename = args.filename || 'export.csv';

      if (!csv.match(/^data:text\/csv/i)) {
          csv = 'data:text/csv;charset=utf-8,' + csv;
      }
      data = encodeURI(csv);

      link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', filename);
      link.click();
  }
