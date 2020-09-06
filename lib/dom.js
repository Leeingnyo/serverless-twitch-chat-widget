const splitByPosition = (string, position) => (position => ([string.slice(0, position), string.slice(position + 1)]))
const splitByTwo = (string, divider) => splitByPosition(string, string.indexOf(divider));
const appendChild = (element, children) => {
  for (child of children) {
    if (child === null || child === undefined || Number.isNaN(child)) continue;
    if (typeof child === 'string' || typeof child === 'number') element.appendChild(document.createTextNode(child.toString()));
    if (typeof child === 'object') {
      if (Array.isArray(child)) { appendChild(element, child); }
      else if (Node.prototype.isPrototypeOf(child)) { element.appendChild(child); }
      else {
        const DATA = 'data', STYLE = 'style';
        const reserved = [DATA, STYLE];
        const keys = Object.keys(child);
        keys.filter(key => !reserved.includes(key)).forEach(key => element.setAttribute(key, child[key]));
        if (child[DATA]) {
          const data = child[DATA];
          if (data && typeof data === 'object') Object.keys(data).forEach(key => element.dataset[key] = data[key]);
        }
        if (child[STYLE]) {
          const style = child[STYLE];
          if (typeof style === 'string') element.style.cssText = style;
          else if (style && typeof style === 'object') Object.keys(style).forEach(key => element.style[key] = style[key]);
        }
      }
    }
  }
};
/**
 * create DOM element
 * @param {string} selector 
 * @param  {...any} children 
 * @returns {Element}
 */
function dom(selector, ... children) {
  if (selector.indexOf('#') < 0 || selector.indexOf('#') > selector.indexOf('.')) {
    var [tagName, ... classNames] = selector.split('.');
  } else {
    var [tagName, idClass] = splitByTwo(selector, '#');
    var [id, ... classNames] = idClass.split('.');
  }
  var element = document.createElement(tagName || 'div');
  if (id) element.id = id;
  for (className of classNames) element.classList.add(className);
  appendChild(element, children);
  return element;
}
function setInnerHTML(dom, html) {
  dom.innerHTML = html;
  return dom;
}
/**
 * @param {string}
 * @returns {Text}
 */
 function text(str) {
  return document.createTextNode(str);
 }