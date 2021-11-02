# be-reflective [TODO]

```html
<third-party-custom-element be-reflective='{
    "prop1": "some-attr-1",
    "prop2": ".some-class-2",
    "prop3": "::some-part-3"
}'></third-party-custom-element>
```

For classes and parts, add / remove class / part based on truthiness of prop.

```html
<a href="//mydomain.com/myPath" target="myIframe">My Link</a>

<iframe name="myIframe" be-reflective='{
    "src": {
        "maxDelay": 100,
        "reflectTo": "data-src"
    }
}'></iframe>
```

Will add a "poll" to check value of src every 100ms (sigh).

