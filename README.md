# motion-demo

A minimal demo project using [Motion](https://github.com/motiondivision/motion) — the animation library for JavaScript and React — installed from npm.

## Setup

```bash
npm install
npm start
```

Then open the URL that `serve` prints (usually http://localhost:3000).

## What's inside

- `index.html` — vanilla JS examples using the Motion UMD bundle (`window.Motion`):
  - a spring-physics stagger animation with a replay button
  - scroll-triggered reveals via `inView`
- `package.json` — `motion` as the only dependency

## Using Motion with a bundler

If you add a bundler (Vite, webpack, etc.), import from the package instead of the UMD bundle:

```js
import { animate, inView, stagger } from "motion";
```

For React, use:

```jsx
import { motion } from "motion/react";
```
