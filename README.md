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
- `SceneQueue(...)` keeps topics separated into navigable scenes. Use the left
  and right arrow keys in the sketch to move between scenes.
- `DihedralGroup(...)` animates rotations and flips of regular polygons.
- `DihedralTable(...)` reveals and highlights multiplication tables such as
  the `D_3` table.
- `Permutation(...)` animates ordered arrangements such as `(1, 2, 3)`.
- `SymmetricGroup(...)` animates `S_n`, the group of all permutations of
  `{1, ..., n}`.
- The two-line permutation notation
  `\begin{pmatrix}1 & 2 & 3\\2 & 3 & 1\end{pmatrix}` means:
  `1 -> 2`, `2 -> 3`, and `3 -> 1`.

## Current Scenes

The sketch is split into three pages:

1. A dihedral-groups scene with animated `D_3` and `D_6` polygons plus a
   `D_3` multiplication table.
2. A `D_4 -> S_4` scene showing how square symmetries become vertex
   permutations. The square labels and two-line notation are animated from the
   same queued moves.
3. An `S_4` scene showing that the symmetric group contains all 24 label
   permutations, while `D_4` has only the 8 permutations that come from rigid
   square motions.

## Permutation Example

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

## Symmetric Group Example

```js
const s4 = new SymmetricGroup(4, {
  x: width / 2,
  y: height / 2,
  title: "Every label-switch is allowed"
});

s4.push("swap", 1, 2);
s4.push("cycle", [1, 2, 3, 4]);
s4.push("map", [1, 2, 3, 4]);
s4.run({ loop: true });
```
