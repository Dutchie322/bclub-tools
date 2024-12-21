if (document.location.search.startsWith('?page=/log-viewer')) {
  document.location.replace(`${document.location.origin}/log-viewer/index.html#/${document.location.search.substring(18)}`);
} else if (document.location.search.startsWith('?page=/options')) {
  document.location.replace(`${document.location.origin}/options/index.html`);
}
