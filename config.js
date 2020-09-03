const currentUrl = new URL(location.href);
const pageConfigs = {
  readOnly: currentUrl.searchParams.get('read-only') === 'true'
};

const defaultConfigs = {
  irc: {
    webSocketUrl: 'wss://irc-ws.chat.twitch.tv:443',
    nick: undefined,
    user: undefined,
    token: undefined
  },
  readOnly: false,
  debug: {
    rawMessages: false,
    parsedMessages: false,
  },
}

const mergeConfigs = (one, another, ...others) => {
  if (others.length !== 0) {
    return mergeConfigs(mergeConfigs(one, another), ...others);
  }
  /**
   * @param {any} obj
   * @returns {boolean}
   */
  const isObject = obj => !!obj && typeof obj === 'object';

  /**
   * deep merge two objects
   * @param {Object} a
   * @param {Object} b
   */
  const merge = (a, b) => {
    const keysOfA = Object.keys(a);
    const keysOfB = Object.keys(b);
    const c = {};

    keysOfA.forEach(keyFromA => {
      if (keysOfB.includes(keyFromA)) {
        c[keyFromA] = mergeConfigs(a[keyFromA], b[keyFromA]);
      } else {
        c[keyFromA] = a[keyFromA];
      }
    });
    keysOfB.forEach(keyFromB => {
      if (keysOfA.includes(keyFromB)) return;
      c[keyFromB] = b[keyFromB];
    });

    return c;
  }

  if (typeof one === 'undefined' && typeof another === 'undefined') return;
  if (typeof one === 'undefined') return another;
  if (typeof another === 'undefined') return one;
  if (isObject(one) && isObject(another)) return merge(one, another);
  if (typeof one === typeof another) return another; // overwrite
  throw Error('both configs have different type at same key');
};