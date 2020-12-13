# be-reflective

Suppose you want a hyperlink to open an iframe.  The platform supports this out of the box, no scripting required:

```html
<a href="//mydomain.com/myPath" target="myIframe">My Link</a>

<iframe name="myIframe"></iframe>
```

But here's the problem:  you don't want the iframe to display until the hyperlink is clicked on.  But without JavaScript.

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

Then, thanks to the style, the iframe won't display, until you click on the hyperlink.  Now, the hyperlink will dutifully set the src attribute of the iframe, and start loading the page, and the style will no longer be applicable, so the iframe becomes visible.  Beautiful!

Oh wait.  The browser doesn't set the src *attribute* when clicking on the hyperlink.  No, it sets the src "property" of iframe, and the iframe doesn't reflect that value to an attribute (or [pseudo class](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)).

Okay, the platform doesn't support that.  But with this web component (with a little JS lurking behind the scenes), this can be done:

```html
<be-reflective upgrade=iframe if-wants-to-be=reflective props='["src"]'></be-reflective>
<style>
iframe:not([src]){
    display:none;
}
</style>

<a href="//mydomain.com/myPath" target="myIframe">My Link</a>

<iframe name="myIframe" be-reflective></iframe>
```

The be-reflective will attach a proxy around the iframe, and monitor for the src being set, and when it is, it will reflect the value to the src attribute.

And of course, this component can be used on any element (native or custom), any prop.

There are some props (like acceptChars, novalidate) where it isn't obvious to the captcha-challenged where, if any, the "dash" should go.

This can be specified thusly:

```html
<be-reflective upgrade=form if-wants-to-be=reflective props='[{"acceptChars": "accept-chars"]'></be-reflective>
```

