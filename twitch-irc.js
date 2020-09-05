/**
 * @typedef {{
     emoteId: string,
     ranges: Array<{ start: number, end: number }>
   }} Emote
 * @typedef {IrcV3Message & {
     emotes: Array<Emote>
   }} TwitchIrcMessage
 */ // FIXME wrong? i want to use extends

/**
 * @param {string} messageString 
 * @returns {TwitchIrcMessage}
 */
const parseTwitchIrcMessage = messageString => {
  const message = parseIrcV3Message(messageString);
  if (message === null) return null;
  if (message.tags && message.tags.emotes && message.tags.emotes.length) {
    // message.?tags.?emotes.?length
    message.emotes = parseEmotes(message.tags.emotes);
  }
  return message;
};

/**
 * @param {string} emotesString 
 * @returns {Array<Emote>}
 */
const parseEmotes = (emotesString) => {
  // 302628617:0-7,9-16
  return emotesString.split('/')
      .map(emoteInfo => emoteInfo.split(':'))
      .map(([emoteId, ranges]) => ({
        emoteId,
        ranges: ranges.split(',').map(range => range.split('-').map(n => Number.parseInt(n)))
            .map(([start, end]) => ({start, end})
        )
      }));
};
