---
layout: page.11ty.cjs
title: <drop-down> ⌲ Home
---

# &lt;drop-down>

`<drop-down>` provides a drop down menu.

## As easy as HTML

<section class="columns">
  <div>

`<drop-down>` is just an HTML element. You can it anywhere you can use HTML!

```html
<drop-down></drop-down>
```

  </div>
  <div>

<drop-down></drop-down>

  </div>
</section>

## Configure with attributes

<section class="columns">
  <div>

`<drop-down>` can be configured with attributed in plain HTML.

```html
<drop-down label="Click me"></drop-down>
```

  </div>
  <div>

<drop-down label="Click me"></drop-down>

  </div>
</section>

## Links and non-links

<section class="columns">
  <div>

```html
<drop-down label="Click me">
  <drop-down-item href="#example">An example link</drop-down-item>
  <drop-down-item href="#another">Another link</drop-down-item>
  <drop-down-item>Just text</drop-down-item>
</drop-down>
```

  </div>
  <div>
    <drop-down label="Click me">
      <drop-down-item href="#example">An example link</drop-down-item>
      <drop-down-item href="#another">Another link</drop-down-item>
      <drop-down-item>Just text</drop-down-item>
    </drop-down>
  </div>
</section>

## Declarative rendering

<section class="columns">
  <div>

`<drop-down>` can be used with declarative rendering libraries like Angular, React, Vue, and lit-html

```js
import {html, render} from 'lit-html';

const label = 'Click me';

render(
  html`
    <h2>This is a &lt;drop-down&gt;</h2>
    <drop-down .label=${label}></drop-down>
  `,
  document.body
);
```

  </div>
  <div>

<h2>This is a &lt;drop-down&gt;</h2>
<drop-down label="Click me"></drop-down>

  </div>
</section>
