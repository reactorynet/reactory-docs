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

## YAML Form Persistence

Starting with the recent updates, the Reactory Forms system now supports YAML form persistence. This feature allows users to save form modifications as YAML overlays without modifying the underlying code.

### Key Features

1. **YAML Overlays**: Form modifications are saved as YAML files that overlay the base code form
2. **Deep Merging**: YAML overlays are deep-merged over code forms to preserve existing functionality
3. **Role-Based Access**: Forms can be restricted by roles
4. **Automatic Discovery**: YAML forms are automatically discovered and made available
5. **Colon Key Support**: Proper handling of YAML colon keys (ui:widget, ui:options, etc.)

### File Structure

YAML forms are stored in `$REACTORY_DATA/forms/` with the naming convention:
`nameSpace.name@version.yaml`

### Example YAML Form

```yaml
id: myapp.profile
nameSpace: myapp
name: Profile
version: 1.0.0
title: User Profile
icon: person
avatar: /images/user-avatar.png
description: Edit user profile information
tags:
  - user
  - profile
roles:
  - USER
  - ADMIN
schema:
  type: object
  properties:
    firstName:
      type: string
      title: First Name
    lastName:
      type: string
      title: Last Name
uiSchema:
  ui:widget: TextWidget
  ui:options:
    placeholder: Enter your name
```

### Configuration

Ensure `REACTORY_DATA` environment variable is set for YAML form persistence:

```bash
export REACTORY_DATA=/path/to/reactory/data
```

This will enable the form system to persist and load YAML overlays from `$REACTORY_DATA/forms/`.

### Usage Example

```javascript
// Get a form with any YAML overlays applied
const form = await formService.get('core.UserProfile');

// List all available forms
const allForms = await formService.list();

// Save a form modification as YAML overlay
const updatedForm = await formService.save({
  id: 'core.UserProfile',
  nameSpace: 'core',
  name: 'UserProfile',
  version: '1.0.0',
  title: 'Updated User Profile',
  schema: { type: 'object', properties: { newField: { type: 'string' } } }
});
```

### Best Practices

1. **Use YAML for Customizations**: Make form modifications through YAML overlays rather than code changes
2. **Role Restrictions**: Apply appropriate role restrictions to sensitive forms
3. **Validation**: Ensure YAML form identifiers are properly validated (alphanumeric, dash, underscore, dot only)
4. **Backward Compatibility**: Code forms continue to work exactly as before
5. **Testing**: Comprehensive unit tests ensure YAML form handling works correctly