# be-reflective [TODO]

One decision web component designers need to make when developing a component is which properties should "reflect" ao attributes.  Doing so may impose a light performance penalty, but it does in many cases make it easier to base styling decisions on state changes.

As a consumer of a third party web component, what if your needs happen to not be met by the choices made by the third party component.

Options to consider first, perhaps are:

1.  Raise an issue or pull request to enhance the component so that it reflects.
2.  Extend the component and override the property setter behavior (or configuration) so the property does reflect.

If the options above are insufficient, then this component could be of help.

Another scenario -- if you are debugging a web component, it might be easier to insert this component temporarily due to the nice debugging features browsers support for changing attributes (flashing when they change).

```html
<be-reflective upgrade=third-party-component if-wants-to-be=reflective props='["propA"]'></be-reflective>

<third-party-component be-reflective></third-party-component>
```

