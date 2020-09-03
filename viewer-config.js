const configs = mergeConfigs(defaultConfigs, {
  irc: {
    nick: NICKNAME,
    user: undefined,
    token: TOKEN
  },
  twitch: {
    channel: CHANNEL_NAME
  },
  readOnly: true
});