class TemplateBuilder {
  constructor(options, imageLinkMap) {
    if (!options) {
      throw new Error('must pass at least 1 argument');
    }
    this.options = options;
    /**
     * @type {Object.<string, string>}
     */
    this.imageLinkMap = imageLinkMap;
  }

  /**
   * @returns {Node}
   */
  chatList() {
    return dom('ul.chat-list');
  }

  /**
   * @param {string} src
   * @returns {Node}
   */
  imageTemplate(src) {
    return dom('img.image', { src });
  }

  /**
   * 
   * @param {TwitchIrcMessage} message 
   * @returns {Node?}
   */
  imagify(message) {
    if (!this.options.imagifyEnabled) return null;
    if (!this.imageLinkMap || !this.imageLinkMap[message.text]) return null;
    return this.imageTemplate(this.imageLinkMap[message.text]);
  }

  /**
   * 
   * @param {string} id 
   * @returns {Node}
   */
  emoteImageTemplate(id) {
    return dom('img.emote', { src: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0` });
  }

  /**
   * 
   * @param {TwitchIrcMessage} message 
   * @returns {Array<Node>}
   */
  emoteText(message) {
    if (!this.options.emotesEnabled) return [text(message.text)];
    if (!message.emotes) return [text(message.text)];
    return message.emotes.map(({ emoteId, ranges }) => ranges.map(range => ({ range, emoteId })))
        .reduce((array, item) => [...array, ...item], [])
        .sort((a, b) => a.range.start - b.range.start)
        .concat([{ end: true }])
        .reduce(({ textArray, lastEnd }, { emoteId, range, end }) => {
          if (end) return textArray.concat([text(message.text.slice(lastEnd))]);
          const result = [];
          const betweenString = message.text.slice(lastEnd, range.start)
          if (betweenString) {
            result.push(text(betweenString))
          }
          result.push(this.emoteImageTemplate(emoteId));
          return {
            textArray: textArray.concat(result),
            lastEnd: range.end + 1
          }
        }, { textArray: [], lastEnd: 0 });
  }

  /**
   * 
   * @param {TwitchIrcMessage} message 
   * @returns {Node}
   */
  messageContentProcess(message) {
    return this.imagify(message) || this.emoteText(message) || text(message.text);
  }

  // IrcMessage => Node
  /**
   * 
   * @param {TwitchIrcMessage} message 
   * @returns {Node}
   */
  messageTemplate(message) { 
    return dom('chat',
      dom('span.nick', `${message.tags && message.tags.displayName || message.sender && message.sender.nick || '(Unknown User)'}`, {
        style: {
          color: this.options.colorCodes[(message.sender && message.sender.username || '(Unknown User)').split('').map(a => a.charCodeAt(0)).reduce((r, c) => r + c, 0) % this.options.colorCodes.length]
        }
      }),
      dom('span.message', this.messageContentProcess(message)), 
    );
  }
}

class ChatList {
  /**
   * @param {TemplateBuilder} templateBuilder 
   * @param {Object} options 
   */
  constructor(templateBuilder, options) {
    if (!TemplateBuilder.prototype.isPrototypeOf(templateBuilder)) {
      throw new Error('pass a template builder at the first parameter');
    }
    if (!options) {
      throw new Error('must pass options');
    }
    this.templateBuilder = templateBuilder;
    this.options = options;

    this.chatList = this.templateBuilder.chatList();
  }

  /**
  * @param {chatList}
  * @returns {IrcMessage => void}
  */
  addMessage(message) {
    var listItem = dom('li.chat-list-item', this.templateBuilder.messageTemplate(message));
    this.chatList.appendChild(listItem);
    reserveRemove(listItem);

    /**
    * @param {Node}
    * @returns {number} - an id of `setTimeout()`
    */
    function reserveRemove(listItem) {
      var chatView = listItem.querySelector('chat');
      var chatNickView = chatView.querySelector('.nick');

      function removeChatListItem() {
        if (listItem.parentNode) {
          listItem.parentNode.removeChild(listItem);
        }
      }

      return setTimeout(function () {
        if (!options.fadeOut) {
          removeChatListItem();
          return;
        }

        chatView.classList.add('fade-out');
        chatView.style.animationDuration = options.fadeOutAnimationTime + 'ms';
        setTimeout(() => {
          removeChatListItem();
        }, options.fadeOutAnimationTime);
      }, options.showTime);
    }
  }

  /**
   * append chat list
   * @param {Node} wrapper 
   */
  mount(wrapper) {
    wrapper.appendChild(this.chatList);
  }
}