const ircMessageHelpers = {
  pong: () => 'PONG :pingis\r\n',
  pass: (password) => `PASS oauth:${password}\r\n`,
  nick: (nickname) => `NICK ${nickname}\r\n`,
  join: chan => `JOIN ${chan}\r\n`,
  part: chan => `PART ${chan}\r\n`,
  privmsg: (chan, text) => `PRIVMSG ${chan} :${text}\r\n`,
};

const parseIrcMessage = ircString => {
  // to constants
  // see https://tools.ietf.org/html/rfc1459#section-2.3.1
  const ircRegExp = /(?::(?<prefix>.*?) +)?(?<command>[a-zA-Z]+?|\d\d\d) +(?<params>.*)/; // ignore middle
  if (!ircRegExp.test(ircString)) return null; // 이게 더 빠른가 아니면 exec 하고 null 체크하는게 더 빠른가 어차피 exec는 할 건데
  const { prefix, command, params } = ircRegExp.exec(ircString).groups;

  const message = {
    prefix, command, params
  };

  if (prefix.includes('!')) {
    const ircPrefixRegExp = /(?<nick>[a-zA-Z]+)(?:!(?<username>.*?)@(?<host>.*))?/;
    if (ircPrefixRegExp.test(prefix)) {
      message.sender = ircPrefixRegExp.exec(prefix).groups;
    }
  } else {
    message.sender = { servername: prefix };
  }

  switch (command) {
    case 'PRIVMSG': {
      // ignore any other case but channel privmsg
      const ircPrivmsgParamsRegExp = /(?<channel>#.*?) +:(?<text>.*)/;
      if (ircPrivmsgParamsRegExp.test(params)) {
        const result = ircPrivmsgParamsRegExp.exec(params).groups;
        message.channel = result.channel;
        message.text = result.text;
      }
    } break;
  }

  return message;
};

// ircv3 tag
const parseTags = (tagString, camelCase = false) => {
  const snakeToCamelCase = string => string.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
  // See https://ircv3.net/specs/extensions/message-tags#escaping-values
  const unescapeTagValue = escaped => escaped.replace(/\\$/, '').replaceAll(/\\(.)/g,
      (s, c) => c === ':' ? ';' : c === 's' ? ' ' : c === '\\' ? '\\' : c === 'r' ? '\r' : c === 'n' ? '\n' : c);
  return tagString.slice(1).split(';')
      .map(tag => tag.split('=', 2))
      .map(([name, value]) => ({ [camelCase ? snakeToCamelCase(name) : name]: unescapeTagValue(value) }))
      .reduce((merged, toMerge) => ({ ...merged, ...toMerge }), {});
};

// string => string
const isValidIrcMessageString = messageString => messageString[0] === '@' || messageString[0] === ':';