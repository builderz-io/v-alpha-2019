var assert = require('assert');
var tools = require('../../functions/tools');

var testData = require('../../test/testData');

describe('Tools', function() {

  // get burned balance

  testData.getBurned.forEach(function(test) {
    it('burns onChain balance according to time passed', function () {
      assert.equal(tools.getBurned(test.entity, test.timeSecondsUNIX).toString(), test.burnedObj.toString());
    });
  });

  // construct user names

  testData.constructUserName.forEach(function(test) {
    it('converted ' + JSON.stringify(test.arg) + ' to "' + test.expected + '"', function() {
      var res = tools.constructUserName(test.arg);
      assert.equal(res, test.expected);
    });
  });

  // wrap links in html

  it('wraps links with html (domain name and tld as anchor)', function() {
    assert.equal(tools.convertLinks(testData.convertLinks.textWithLinks), testData.convertLinks.textResult);
  });


});
