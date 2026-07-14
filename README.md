# Janim

Janim is a small p5.js playground for explaining group theory, permutations,
and mathematical notation through animation.

## Documentation Engine

This project uses [JSDoc](https://jsdoc.app/) because the code is plain browser
JavaScript rather than TypeScript or C++. JSDoc keeps examples close to the
classes and functions they explain, then generates browsable HTML pages.

Run:

```powershell
npm.cmd install
npm.cmd run docs
```

The generated documentation is written to `docs/`.

## Main Ideas

- `Equation(...)` renders LaTeX through MathJax and p5 images.
- `FloatingText(...)` adds simple p5 text labels that can be attached to other
  objects.
- `Permutation(...)` animates ordered arrangements such as `(1, 2, 3)`.
- `SymmetricGroup(...)` animates `S_n`, the group of all permutations of
  `{1, ..., n}`.
- The two-line permutation notation
  `\begin{pmatrix}1 & 2 & 3\\2 & 3 & 1\end{pmatrix}` means:
  `1 -> 2`, `2 -> 3`, and `3 -> 1`.

## Example

```js
const p = new Permutation([1, 2, 3], {
  x: width / 2,
  y: height / 2
});

p.push("This note belongs to the permutation.", {
  x: 0,
  y: -180
});

p.push("pause");
p.push("map", [1, 3, 2]);
p.push("pause");
p.push("swap", 1, 3);
p.run({ loop: true });
```
