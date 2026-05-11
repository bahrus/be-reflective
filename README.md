


## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule update --init --recursive
6. > npm install
7. > npm run serve
8. Open http://localhost:8000/ in a modern browser

## Running Tests

```
> npm run test
```

## Using from ESM Module:

```JavaScript
import 'be-reflective/be-reflective.js';
```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.sh/be-reflective';
</script>
```
