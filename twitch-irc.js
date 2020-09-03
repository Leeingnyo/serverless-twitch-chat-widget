// string -> message
const parseTwitchIrcMessage = messageString => {
  if (messageString[0] === '@') { // tagged irc
    const firstSpaceIndex = messageString.indexOf(' ');
    var tagString = messageString.slice(0, firstSpaceIndex);
    var ircString = messageString.slice(firstSpaceIndex + 1);
  } else {
    var ircString = messageString;
  }
  return {
    raw: {
      messageString,
      tagString,
      ircString
    },
    ... (tagString && { tags: parseTags(tagString, true) }), // ?
    ... parseIrcMessage(ircString)
  };
};
// string -> messages
const parseTwitchIrcMessages = string => string.split(/\r\n|\r|\n/)
    .filter(splitted => isValidIrcMessageString(splitted))
    .map(messageString => parseTwitchIrcMessage(messageString)) // to generator?
    .filter(message => message !== null);