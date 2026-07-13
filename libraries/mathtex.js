async function latexImage(latex, options = {}) {
  await waitForMathJax();

  const settings = {
    size: options.size || 36,
    color: options.color || "black",
    display: options.display !== false
  };

  const node = await MathJax.tex2svgPromise(latex, {
    display: settings.display,
    em: settings.size,
    ex: settings.size / 2,
    containerWidth: 100000
  });

  const adaptor = MathJax.startup.adaptor;
  const svg = adaptor.tags(node, "svg")[0];
  adaptor.setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
  adaptor.setAttribute(svg, "fill", settings.color);
  adaptor.setAttribute(svg, "stroke", settings.color);

  const group = adaptor.tags(svg, "g")[0];
  if (group) {
    adaptor.setAttribute(group, "fill", settings.color);
    adaptor.setAttribute(group, "stroke", settings.color);
  }

  setSvgPixelSize(svg, adaptor, settings.size);
  return svgToP5Image(adaptor.serializeXML(svg));
}

function waitForMathJax() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.MathJax && MathJax.startup && MathJax.startup.promise && MathJax.tex2svgPromise) {
        MathJax.startup.promise.then(resolve);
      } else {
        setTimeout(check, 20);
      }
    };

    check();
  });
}

function setSvgPixelSize(svg, adaptor, size) {
  const width = mathJaxLengthToPixels(adaptor.getAttribute(svg, "width"), size);
  const height = mathJaxLengthToPixels(adaptor.getAttribute(svg, "height"), size);

  adaptor.setAttribute(svg, "width", String(Math.ceil(width)));
  adaptor.setAttribute(svg, "height", String(Math.ceil(height)));
}

function mathJaxLengthToPixels(value, size) {
  const textValue = String(value || "0");
  const amount = parseFloat(textValue) || 0;

  if (textValue.endsWith("ex")) return amount * size / 2;
  if (textValue.endsWith("em")) return amount * size;
  return amount;
}

function svgToP5Image(svgText) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    loadImage(url, (img) => {
      URL.revokeObjectURL(url);
      resolve(img);
    }, (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    });
  });
}
