
require.config({
  "paths": {
    "jquery": "bower_components/jquery/jquery",
    "dynoforms": "dynoforms"
  }
});


require(['dynoforms', 'jquery'], function (dynoforms, $) {

  var testSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Container Content Node",
    "description": "A bootstrap grid container.",
    "type": "object",
    "required": [
      "linked_url_node_keys"
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
        "title": "Content"
      }
    }
  },

  // Configure form options like this
    formConfig = {
      properties: {
        gender: {
          choices: [
            ['Male', 'male'],
            ['Female', 'female']
          ]
        },
        num_siblings: {
          choices: [
            ['One', 1],
            ['Two', 2],
            ['Three', 3]
          ]
        }
      },
      order: [
        'content',
        'content_tree_order',
        'num_siblings',
        'gender',
        'updated',
        'linked_url_node_keys',
        'created',
        'currently_cacheable',
        'content_tree_parent'
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

  form = new dynoforms.Form(testSchema, formConfig, testInstance);

  console.log(form.getData());

  $('.dynoform').append(form.$el);
});
