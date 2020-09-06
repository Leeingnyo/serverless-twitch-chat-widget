/**
 * @type {Object.<string, function(... any): string>}
 */
const ircMessageHelpers = {
  pong: () => 'PONG :pingis\r\n',
  pass: (password) => `PASS oauth:${password}\r\n`,
  nick: (nickname) => `NICK ${nickname}\r\n`,
  join: chan => `JOIN ${chan}\r\n`,
  part: chan => `PART ${chan}\r\n`,
  privmsg: (chan, text) => `PRIVMSG ${chan} :${text}\r\n`,
};

/**
 * @typedef {Object} ServerSender
 * @property {string} servername 

 * @typedef {Object} UserSender
 * @property {string?} username 
 * @property {string} nick 
 * @property {string?} host 

 * @typedef {ServerSender|UserSender} Sender
 */

/**
 * @typedef {Object} IrcMessage
 * @property {string} ircString - raw irc string
 * @property {string?} prefix - raw prefix string
 * @property {string} command - command
 * @property {string} params - raw params string
 * @property {Sender?} sender - sender information
 * @property {string?} channel - channel
 * @property {string?} text - text
 */ // FIXME wrong

// to constants
// see https://tools.ietf.org/html/rfc1459#section-2.3.1
const IRC_MESSAGE_REGEXP = /(?::(?<prefix>.*?) +)?(?<command>[a-zA-Z]+?|\d\d\d) +(?<params>.*)/; // ignore middle
const IRC_MESSAGE_PREFIX_REGEXP = /(?<nick>[a-zA-Z]+)(?:!(?<username>.*?)@(?<host>.*))?/;
const IRC_MESSAGE_PRIVMSG_PARAMS_REGEXP = /(?<channel>#.*?) +:(?<text>.*)/;

/**
 * parse string as a irc message
 * @param {string} ircString a string to parse
 * @returns {IrcMessage} an object parsed as a irc message
 */
const parseIrcMessage = ircString => {
  if (!IRC_MESSAGE_REGEXP.test(ircString)) return null; // 이게 더 빠른가 아니면 exec 하고 null 체크하는게 더 빠른가 어차피 exec는 할 건데
  const { prefix, command, params } = IRC_MESSAGE_REGEXP.exec(ircString).groups;

  const message = {
    ircString, command, params, ... (prefix && { prefix })
  };

  if (prefix) {
    if (prefix.includes('!')) {
      if (IRC_MESSAGE_PREFIX_REGEXP.test(prefix)) {
        message.sender = IRC_MESSAGE_PREFIX_REGEXP.exec(prefix).groups;
      }
    } else {
      message.sender = { servername: prefix };
    }
  }

  switch (command) {
    case 'PRIVMSG': {
      // ignore any other case but privmsg that sends message to a channel
      if (IRC_MESSAGE_PRIVMSG_PARAMS_REGEXP.test(params)) {
        const result = IRC_MESSAGE_PRIVMSG_PARAMS_REGEXP.exec(params).groups;
        message.channel = result.channel;
        message.text = result.text;
      }
    } break;
  }

  return message;
};

/**
 * parse => string -> messages
 * @param {(string: string) => IrcMessage} parse function that parses a single message
 * @returns {(string: string) => Array<IrcMessage>} function that parses multiple lines to multiple messages
 */
const parseIrcMessages = parse => string => string.split(/\r\n|\r|\n/)
    .map(messageString => parse(messageString)) // to generator?
    .filter(message => message !== null);

/**
 * @typedef {Object.<string, string>} Tags
 * @typedef {IrcMessage & {
     messageString: string,
     tagString: string?
     tags: Tags?
   }} IrcV3Message
 */ // FIXME wrong? i want to use extends

const IRCV3_MESSAGE_REGEXP = /(?<tagString>@.*? +)?(?<ircString>(?::(?<prefix>.*?) +)?(?<command>[a-zA-Z]+?|\d\d\d) +(?<params>.*))/;

/**
 * parse ircv3 tags
 * @param {string} tagString - string to parse as tags
 * @param {boolean} camelCase - the default value is `false`
 * @returns {Tags} parsed tags
 */
const parseTags = (tagString, camelCase = false) => {
  const snakeToCamelCase = string => string.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
  // See https://ircv3.net/specs/extensions/message-tags#escaping-values
  const unescapeTagValue = escaped => escaped.replace(/\\$/, '').replaceAll(/\\(.)/g,
      (s, c) => c === ':' ? ';' : c === 's' ? ' ' : c === '\\' ? '\\' : c === 'r' ? '\r' : c === 'n' ? '\n' : c);
  return tagString.split(';')
      .map(tag => tag.split('=', 2))
      .map(([name, value]) => ({ [camelCase ? snakeToCamelCase(name) : name]: unescapeTagValue(value) }))
      .reduce((merged, toMerge) => ({ ...merged, ...toMerge }), {});
};

/**
 * parse ircv3 message
 * @param {string} ircV3String 
 * @returns {IrcV3Message} 
 */
const parseIrcV3Message = ircV3String => {
  if (!IRCV3_MESSAGE_REGEXP.test(ircV3String)) return null;
  const { tagString, ircString } = IRCV3_MESSAGE_REGEXP.exec(ircV3String).groups;
  return {
    messageString: ircV3String,
    ... (tagString && { tagString, tags: parseTags(tagString, true) }), // ?
    ... parseIrcMessage(ircString)
  };
};