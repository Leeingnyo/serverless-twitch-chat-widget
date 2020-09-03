const currentUrl = new URL(location.href);
const pageConfigs = {
  readOnly: currentUrl.searchParams.get('read-only') === 'true'
};

// add default config

const configs = {
  irc: {
    webSocketUrl: 'wss://irc-ws.chat.twitch.tv:443',
    nick: NICKNAME,
    user: undefined,
    token: TOKEN
  },
  twitch: {
    channel: CHANNEL_NAME
  },
  readOnly: pageConfigs.readOnly
};