/* global window, document, YT */

let iframeLoaded = false;

function youtubePlayer() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (iframeLoaded) {
        resolve(id => new YT.Player(id));
        clearInterval(interval);
      }
    }, 50);
  });
}

const scriptElement = document.createElement('script');
scriptElement.src = 'https://www.youtube.com/iframe_api';
const firstScriptElement = document.getElementsByTagName('script')[0];
firstScriptElement.parentNode.insertBefore(scriptElement, firstScriptElement);

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  iframeLoaded = true;
};

module.exports = youtubePlayer;
