/**
 * A fluent utility to attach a HTML template to an element.
 * @example attachTemplate(templateHtml).to.shadowDOM(this)
 */
export function attachTemplate (templateHtml) {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(templateHtml, 'text/html');

  const template = doc.querySelector('template');
  const docFragment = template.content.cloneNode(true);

  return {
    to: {
      shadowDOM: (element) => {
        element.attachShadow({ mode: 'open' }).appendChild(docFragment);
      },
      element: (element) => {
        element.appendChild(docFragment);
      }
    }
  };
}
