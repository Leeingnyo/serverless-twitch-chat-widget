const currentUrl = new URL(location.href);
const pageConfigs = {
  readOnly: currentUrl.searchParams.get('read-only') === 'true'
};

// add default config

const configs = {
  twitch: {
    webSocketUrl: 'wss://irc-ws.chat.twitch.tv:443',
    token: TOKEN,
    nick: NICKNAME,
    channel: CHANNEL_NAME
  },
  page: pageConfigs
};