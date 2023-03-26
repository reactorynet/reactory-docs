
# Object Mapping

Object mapping is an essential concept to understand in Reactory. The platform utilizes the [object-mapper](https://www.npmjs.com/package/object-mapper) in both the client and server, with "propertyMap" properties available for many components. These maps dynamically map properties to components, depending on the execution context.

```javascript
var original = {
  "sourceKey": null,
  "otherSourceKey": null
}
 
var transform = {
  "sourceKey": "canBeNull?",
  "otherSourceKey": "cannotBeNull"
}
 
var results = ObjectMapper(original, {}, transform);
 
// Results would be the following
{
  canBeNull: null
}

```

See the project [object-mapper](https://www.npmjs.com/package/object-mapper) for more details