// twitch bot (irc v3 bot (irc bot)) ?
class TwitchIrcClient {
  constructor(configs) {
    this.handlers = {};
    this.count = 0;
    this.configs = configs;
  }

  async connect() {
    const ws = new WebSocket(this.configs.twitch.webSocketUrl);
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(ircMessageHelpers.pass(this.configs.twitch.token));
        ws.send(ircMessageHelpers.nick(this.configs.twitch.nick));
        ws.send(ircMessageHelpers.join(this.configs.twitch.channel));
        resolve(ws);
      };
      ws.onerror = e => console.error(e);
    });
  };

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
      const messages = parseTwitchIrcMessages(e.data);
      console.log(... messages);

      messages.forEach(message => {
        if (message.command === 'PING') {
          ws.send(ircMessageHelpers.pong());
          return;
        }

        Object.freeze(message);

        Object.values(this.handlers).forEach(handler => {
          handler.handle(message, message.channel ? (
            sayCache[message.channel] ||
            (sayCache[message.channel] = function (text) { if (!this.configs.page.readOnly && text) ws.send(ircMessageHelpers.privmsg(message.channel, text)) })
          ) : undefined);
        });
      });
    }
  };

  async run() {
    this.ws = await this.connect();
    this.bind(this.ws);
  }
};