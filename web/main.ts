class MainView {
  private readonly viewElem: HTMLElement;

  constructor(viewElem: HTMLElement) {
    this.viewElem = viewElem;

    this.render();
  }

  render() {
    this.renderSearchBar();
  }

  renderSearchBar() {
    const input = document.createElement('input');
    input.maxLength = 512;
    input.placeholder = 'Search API Path';
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const path = input.value;
        if (path) {
          sendMessage({
            type: 'jump',
            path,
          });
        }
      }
    });
    this.viewElem.querySelector('.search-bar')!.appendChild(input);
  }
}

let loaded = false;
window.addEventListener('load', () => {
  if (loaded) { return; }
	loaded = true;

  /* window.main =  */new MainView(document.getElementById('view') as HTMLElement);

  window.addEventListener('message', (e) => {
    console.log(e.data);
    sendMessage({ type: 'res' });
  });

  sendMessage({ type: 'onload', dom: 11 });
});