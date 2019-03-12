
// NOTE: Adding request and transfer commands requires updating the backend language files also

var forbiddenFirstNamesEN = ['to', 'and'],
    forbiddenFirstNamesDE = ['an', 'und'];

var commandsHelp = ['help', 'hilfe', '도움'];

var commandsSearch = ['search', 'suche', 'find', 'finde', 'fx', 'f!', 'view'];

var    commands = ['nukeme', 'crashapp', 'verify', 'disable', 'enable', 'makeadmin', 'revokeadmin', 'analyse', 'a!'],
     commandsEN = ['+', '-', 'pay', 'send', 'request', 'transfer', 'sx', 's!', 'rx', 'r!', 'tx', 't!'],
     commandsDE = ['zahle', 'sende', 'empfange', 'leite', 'zahlen', 'senden', 'empfangen', 'leiten'],
     commandsKO = ['더하기', '지불하다', '전송', '요청']; // TODO: add 'transfer' and check sychronicity of 'request' and 'transfer' with backend translation file

var misspellingsEN = ['sent', 'sned', 'sedn', 'semd', 'sen', 'snd', 'sed'],
    misspellingsDE = [];


// TODO: define short commands in other languages
