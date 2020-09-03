class IrcClient {
  constructor(configs) {
    this.handlers = {};
    this.count = 0;
    this.configs = configs;
    this.parser = parseIrcMessages(parseIrcMessage)
  }

  async connect() {
    const ws = new WebSocket(this.configs.irc.webSocketUrl);
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        if (this.configs.irc.token) {
          ws.send(ircMessageHelpers.pass(this.configs.irc.token));
        }
        if (this.configs.irc.nick) {
          ws.send(ircMessageHelpers.nick(this.configs.irc.nick));
        }
        resolve(ws);
      };
      ws.onerror = e => reject(e);
    });
  };

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
      this.ws.send(message);
    }
  }

  registerHandler(handler, name) {
    if (!handler || typeof handler.handle !== 'function') {
      throw Error('the handler is not valid');
    }
    name = name || handler.name || (`handler${this.count++}`);

    this.handlers[name] = handler;

    return name;
  }

  bind(ws) {
    const sayCache = [];
    ws.onmessage = e => {
      const messages = this.parser(e.data);
      if (this.configs.debug.rawMessages) {
        console.debug(e.data);
      }
      const configs = this.configs;

      if (this.configs.debug.parsedMessages) {
        console.debug(... messages);
      }

      messages.forEach(message => {
        if (message.command === 'PING') {
          ws.send(ircMessageHelpers.pong());
          return;
        }

        Object.freeze(message);

        Object.values(this.handlers).forEach(handler => {
          handler.handle(message, message.channel ? (
            sayCache[message.channel] ||
            (sayCache[message.channel] = function (text) { if (!configs.readOnly && text) ws.send(ircMessageHelpers.privmsg(message.channel, text)) })
          ) : undefined);
        });
      });
    }
  }

  async run() {
    this.ws = await this.connect();
    this.bind(this.ws);
  }
}

class IrcV3Client extends IrcClient {
  constructor(configs) {
    super(configs);
    this.parser = parseIrcMessages(parseIrcV3Message);
  }
};

class TwitchIrcClient extends IrcV3Client {
  constructor(configs) {
    super(configs);
  }

  async connect() {
    const ws = await super.connect();
    ws.send('CAP REQ :twitch.tv/tags\r\n');
    ws.send(ircMessageHelpers.join(this.configs.twitch.channel));
    return ws;
  };

  send() { throw new Error('don\'t call send()') }
};