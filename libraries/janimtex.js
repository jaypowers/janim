/*
  JanimTex + MathJax

  Turns LaTeX strings into p5.Image objects by asking MathJax for SVG,
  then loading that SVG through p5's loadImage().

  Usage:
    let formula;

    function setup() {
      createCanvas(800, 500);
      jtex("\\sqrt{x^2 + y^2} = 1", { size: 48, color: "white" })
        .then((img) => formula = img);
    }

    function draw() {
      background(30);
      if (formula) image(formula, 40, 40);
    }
*/
(function (global) {
  "use strict";

  const cache = new Map();

  function normalizeOptions(sizeOrOptions, color) {
    if (typeof sizeOrOptions === "number") {
      return {
        size: sizeOrOptions,
        color: color || "black",
        display: true,
        scale: 1
      };
    }

    return Object.assign({
      size: 36,
      color: "black",
      display: true,
      scale: 1
    }, sizeOrOptions || {});
  }

  function cacheKey(latex, options) {
    return JSON.stringify({
      latex,
      size: options.size,
      color: options.color,
      display: options.display,
      scale: options.scale
    });
  }

  function waitForMathJax() {
    if (!global.MathJax) {
      return Promise.reject(new Error("MathJax is not loaded. Add the MathJax tex-svg script before using jtex()."));
    }

    if (global.MathJax.startup && global.MathJax.startup.promise) {
      return global.MathJax.startup.promise;
    }

    return Promise.resolve();
  }

  async function latexToSvgString(latex, options) {
    await waitForMathJax();

    if (typeof MathJax.tex2svgPromise !== "function") {
      throw new Error("MathJax tex2svgPromise() is unavailable. Load the tex-svg MathJax component.");
    }

    const adaptor = MathJax.startup.adaptor;
    const result = await MathJax.tex2svgPromise(latex, {
      display: options.display,
      em: options.size,
      ex: options.size / 2,
      containerWidth: 100000
    });

    const svg = adaptor.tags(result, "svg")[0];
    adaptor.setAttribute(svg, "xmlns", "http://www.w3.org/2000/svg");
    adaptor.setAttribute(svg, "fill", options.color);
    adaptor.setAttribute(svg, "stroke", options.color);

    const g = adaptor.tags(svg, "g")[0];
    if (g) {
      adaptor.setAttribute(g, "fill", options.color);
      adaptor.setAttribute(g, "stroke", options.color);
    }

    // p5 can load SVGs, but it needs a real intrinsic size.
    const width = getExSize(adaptor.getAttribute(svg, "width"), options);
    const height = getExSize(adaptor.getAttribute(svg, "height"), options);
    adaptor.setAttribute(svg, "width", String(Math.ceil(width)));
    adaptor.setAttribute(svg, "height", String(Math.ceil(height)));

    return adaptor.serializeXML(svg);
  }

  function getExSize(value, options) {
    const text = String(value || "0");
    const amount = parseFloat(text) || 0;

    if (text.endsWith("ex")) {
      return amount * (options.size / 2) * options.scale;
    }

    if (text.endsWith("em")) {
      return amount * options.size * options.scale;
    }

    return amount * options.scale;
  }

  function svgStringToImage(svgString) {
    return new Promise((resolve, reject) => {
      if (typeof loadImage !== "function") {
        reject(new Error("p5 loadImage() is not available yet. Call jtex() from setup() or later."));
        return;
      }

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      loadImage(url, (img) => {
        URL.revokeObjectURL(url);
        resolve(img);
      }, (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  async function jtex(latex, sizeOrOptions, color) {
    const options = normalizeOptions(sizeOrOptions, color);
    const key = cacheKey(latex, options);

    if (!cache.has(key)) {
      cache.set(key, latexToSvgString(String(latex || ""), options).then(svgStringToImage));
    }

    return cache.get(key);
  }

  async function drawTex(latex, x, y, sizeOrOptions, color) {
    const options = normalizeOptions(sizeOrOptions, color);
    const align = options.align || "left";
    const valign = options.valign || "center";
    const img = await jtex(latex, options);

    let drawX = x;
    let drawY = y;

    if (align === "center") drawX -= img.width / 2;
    if (align === "right") drawX -= img.width;
    if (valign === "center") drawY -= img.height / 2;
    if (valign === "bottom") drawY -= img.height;

    image(img, drawX, drawY);
    return img;
  }

  global.JanimTex = {
    render: jtex,
    draw: drawTex,
    latexToSvgString
  };
  global.jtex = jtex;
  global.drawTex = drawTex;
})(window);
