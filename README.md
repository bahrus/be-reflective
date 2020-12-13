# be-reflective [TODO]

**NB*  This seems to be beyond the capabilities of the browser (maybe by design).  

Suppose you want a hyperlink to open an iframe.  The platform supports this out of the box, no scripting required:

```html
<a href="//mydomain.com/myPath" target="myIframe">My Link</a>

<iframe name="myIframe"></iframe>
```

But here's the rub:  you don't want the iframe to display until the hyperlink is clicked on.  But without JavaScript.

No problem, you might be thinking.  Just do this:


```html
<style>
iframe:not([src]){
    display:none;
}
</style>

<a href="//mydomain.com/myPath" target="myIframe">My Link</a>

<iframe name="myIframe"></iframe>
```

Then, thanks to the style, the iframe won't display, until you click on the hyperlink.  Now, the hyperlink will dutifully set the src attribute of the iframe, and the iframe will start loading the page, and the style will no longer be applicable, so the iframe becomes visible.  Beautiful!

Oh wait.  The browser doesn't set the src *attribute* when clicking on the hyperlink.  No, it sets the src "property" of iframe, and the iframe doesn't reflect that value to an attribute (or [pseudo class](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)).

Okay, the platform doesn't support that.  But with this web component (with a little JS lurking behind the scenes), this can be done:

```html
<be-reflective upgrade=iframe if-wants-to-be=reflective props='["src"]'></be-reflective>
<style>
iframe:not([src]){
    display:none;
}
</style>

<a href="//mydomain.com/myPath" be-target-reflective target="myIframeProxy">My Link</a>

<proxy-props name=myIframeProxy for=be-reflective></proxy-props>
<iframe name="myIframe" be-reflective></iframe>
```

The (local instance of the) be-reflective web component will attach a proxy around the iframe, and monitor for the src being set, and when it is, it will reflect the value to the src attribute.  It will also set the attribute if the property is already set once the web component is loaded.

This component can be used in combination with any element (native or custom), any prop.

For example, to apply to all DOM elements:

```html
<be-reflective upgrade=* if-wants-to-be=reflective props='["diabled"]'></be-reflective>
```

To be precise, "be-reflective" only wants to apply to sections of a web application where there is "buy-in" to be reflective, so a separate instance is required in each ShadowDOM realm.  And that includes outside any ShadowDOM realm.

For those holdouts who value sticking to data-* attributes, the target can use data-be- as the prefix, rather than just be-

There are some props (like acceptChars, novalidate properties of the form element) that makes it not so obvious to the captcha-challenged where, if any, a "dash" should go when translating between the property and attribute.  By default, be-reflective assumes the attribute is the same as the property (attributes are case insensitive), but the be-reflective component supports an option to use lisp-case:

```html
<be-reflective upgrade=form if-wants-to-be=reflective use-lisp-case props='[{"acceptCharset"]'></be-reflective>
```

If you have a mix of naming conventions, then spelling it out is necessary:

```html
<be-reflective upgrade=form if-wants-to-be=reflective props='[{"acceptCharset": "accept-charset"},{"noValidate","novalidate"}]'></be-reflective>
```



