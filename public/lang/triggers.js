
var forbiddenFirstNamesEN = ['to', 'and'],
    forbiddenFirstNamesDE = ['an', 'und'];

var commandsHlp = ['help', 'hilfe', '도움'];

var    commands = ['+', '-', 'nukeme', 'verify', 'disable', 'enable', 'makeadmin', 'revokeadmin'],
     commandsEN = ['plus', 'minus', 'pay', 'send', 'request', 'transfer'],
     commandsDE = ['zahle', 'sende', 'empfange', 'leite'],
     commandsKO = ['더하기', '지불하다', '전송' , '요청']; // TODO: add 'transfer' and check sychronicity of 'request' and 'transfer' with backend translation file

var misspellingsEN = ['sent', 'sned', 'sedn', 'semd', 'sen', 'snd', 'sed'];
