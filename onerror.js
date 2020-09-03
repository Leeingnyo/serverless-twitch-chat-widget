window.onerror = function (errorMessage, _, __, ___, err) {
  document.querySelector('body').style.whiteSpace = 'pre-line';
  document.querySelector('body').innerHTML += 'something went wrong! reload after 3 seconds\n' +
      (err && err.stack) + '\n\n';

  setTimeout(function () {
    location.href = location.href;
  }, 3000);
}