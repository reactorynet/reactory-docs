![Build Anything Fast](/branding/reactory-logo.png)
# Reactory Forms
The Forms Engine is built on top of the [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/) forms library, which is a mature and well-designed library that has been modified to work with the Reactory engine. Our focus is to align closer with the project and refactor the code to augment the components vs change them. This will be part of a major Reactory client update.

## Widgets
The forms engine makes use of default widgets that is registered in the forms component registry to bind to data types. These will generally be rendered with text boxes, slider widget, number inputs and date selectors depending on the data type of the property and any format that is applied to it.  A `ui:widget` property can be defined on a UI Schema for a given field.

We have 30 odd widgets [widgets](widgets/built-in.md) already built that is compatible with the forms engine.

You are able to author your own widgets as long as they conform to the  basic signature properties 

```typescript
{
  formData: any
  formContext: Reactory.Form.IReactoryFormContext
  onChange: (data) => void
  schema: AnySchema
  uiSchema: AnyUISchema

}
```

There are other, properties that will be passed down feel free to check out some of our widgets as examples and then decide how you want to roll your own.


The widget for a field is defined on the uiSchema for the property in question.
e.g.

```javascript
schema = {
  type: 'object',
  title: 'Form',
  properties: {
    StringField: {
      type: 'string',
      title: 'String Field'
    },
    DateField: {
      type: 'string',
      format: 'date-time'
    },
    NumberField: {
      type: 'number'
    }
  }
}

uiSchema = {
  StringField: {
    // this is the default widget so we don't have to specify it
    //'ui:widget': 'TextField'
  },
  DateField: {
    'ui:widget': 'DateTime' // explicity set the widget to a DateTime widget
  },
  NumberField: {
    // will still render as TextField but will only allow number inputs.
  }
}
```

You can load your widgets into the form using the widgetMap property on the ReactoryForm definition

```javascript

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "street_address": {
      "type": "string",
      "title": "Street Address"
    },
    "city": {
      "type": "string",
      "title": "City"
    },
    "state": {
      "type": "string",
      "title": "State"
    },
    "zip_code": {
      "type": "string",
      "title": "Zip Code"
    }
  },
  "required": ["street_address", "city", "state", "zip_code"]
}
```
## UI Schema
```javascript
const uiSchema1 = {
  "ui:title": "Address",
  "street": {
    "ui:title": "Street"
  },
  "city": {
    "ui:title": "City"
  },
  "state": {
    "ui:title": "State"
  },
  "zip": {
    "ui:title": "Zip"
  }
}
const uiSchema2 = {
  "street": {
    "ui:options": {
      "placeholder": "Enter your street address"
    }
  },
  "city": {
    "ui:options": {
      "placeholder": "Enter your city"
    }
  },
  "state": {
    "ui:options": {
      "placeholder": "Enter your state"
    }
  },
  "zip": {
    "ui:widget": "RadioGroupComponent",
    "ui:options": {
      "placeholder": "Enter your zip code"
    }
  }
};

const formDef1 = {
  ... 
  schema,
  uiSchema: uiSchema1
}

const formDef2 = {
  ... 
  widgetMap: [
    { componentFqn: 'core.RadioGroupComponent@1.0.0', widget: 'RadioGroupComponent' },
  ],
  schema,
  uiSchema: uiSchema1
}
```

