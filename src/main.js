
require.config({
  "paths": {
    "jquery": "bower_components/jquery/jquery",
    "react": "bower_components/react/react",
    "dynoforms": "dynoforms"
  }
});


require(['dynoforms', 'jquery', 'react'], function (dynoforms, $, React) {

  var testSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Container Content Node",
    "description": "A bootstrap grid container.",
    "type": "object",
    "required": [
      "linked_url_node_keys",
      "num_siblings"
    ],
    "properties": {
      "gender": {
        "type": "string",
        "enum": ["male", "female"],
        "title": "Gender"
      },
      "num_siblings": {
        "type": "integer",
        "enum": [1, 2, 3],
        "title": "Number of Siblings"
      },
      "content_tree_order": {
        "type": "integer",
        "title": "Content Tree Order"
      },
      "updated": {
        "type": "string",
        "format": "date-time",
        "title": "Updated"
      },
      "linked_url_node_keys": {
        "items": {
          "type": "string"
        },
        "type": "array",
        "title": "Linked URL Node Keys"
      },
      "created": {
        "type": "string",
        "format": "date-time",
        "title": "Created"
      },
      "currently_cacheable": {
        "type": "boolean",
        "title": "Currently Cacheable"
      },
      "content_tree_parent": {
        "type": "string",
        "title": "Content Tree Parent"
      },
      "content": {
        "type": "string",
        "title": "Content",
        "format": "rich-html"
      },
      "nested": {
        "title": "Container Content Node",
        "type": "object",
        "properties": {
          "gender": {
            "type": "string",
            "enum": ["male", "female"],
            "title": "Gender"
          },
          "content": {
            "type": "string",
            "title": "Content",
            "format": "rich-html"
          }
        }
      }
    }
  },

  // Configure form options like this
  formConfig = {
    properties: {
      "gender": {
        choices: [
          ['Male', 'male'],
          ['Female', 'female']
        ],
        helpText: 'The gender of a human'
      },
      "num_siblings": {
        choices: [
          ['One', 1],
          ['Two', 2],
          ['Three', 3]
        ],
        helpText: 'Brothers and sisters only'
      },
      "content_tree_order": {
        helpText: 'The items order in the page'
      },
      "updated": {
        helpText: 'When this item was last updated'
      },
      "linked_url_node_keys": {
        helpText: 'Other pages which link to this'
      },
      "created": {
        helpText: 'Datetime when this item was first created'
      },
      "currently_cacheable": {
        helpText: 'Can this item currently be cached?'
      },
      "content_tree_parent": {
        helpText: 'Id of the parent content node'
      },
      "content": {
        helpText: 'Markdown-formatted text'
      }
    },
    order: [
      'gender',
      'content',
      'content_tree_order',
      'num_siblings',
      'updated',
      'linked_url_node_keys',
      'created',
      'currently_cacheable',
      'content_tree_parent',
      'nested'
    ]
  },

  testInstance = {
    "gender": "female",
    "num_siblings": 3,
    "content_tree_order": 0,
    "updated": "25/12/1983",
    "linked_url_node_keys": ["1", "2", "3"],
    "created": "25/12/1983",
    "currently_cacheable": true,
    "content_tree_parent": "123456789",
    "content": "<h1>Hello World!</h1>"
  },

  form = React.renderComponent(dynoforms.Dynoform(
    {config: dynoforms.mergeConfigs(testSchema, formConfig)}
  ), $('.dynoform')[0]),

  data;

  // Set the data on the form
  form.setValue(testInstance);

  // Get the data from the form
  data = form.getValue();

  // Do validation somewhere else (on the server, perhaps), then
  // set errors like this
  form.setErrors({
    __all__: 'There were non-field errors', // Similar to a Django form
    content: 'That does not look like valid markdown to us' // Field-specific errors
  });

  window.form = form;
  window.React = React;
});
