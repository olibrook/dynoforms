
define(['jquery', 'react'], function($, React){

  'use strict';

  var d = React.DOM,

  Dynoform = React.createClass({

    displayName: 'Dynoform',

    getDefaultProps: function() {
      return {
        cols: {
          left: 2,
          right: 10
        }
      };
    },

    render: function() {
      var cols = {left: this.props.cols.left, right: this.props.cols.right},
          orderedFields,
          key;

      // Work out field ordering, if specified.
      if(exists(this.props.config.order)){
        orderedFields = this.props.config.order;
      } else {
        orderedFields = [];
        for(key in this.props.config.properties){
          if(this.props.config.properties.hasOwnProperty(key)){
            orderedFields.push(key);
          }
        }
      }

      return d.form({onSubmit: this.onSubmit, className: 'form-horizontal', role: 'form'},
        orderedFields.map(function(fieldName){
          return this.renderField(
              fieldName,
              this.props.config.properties[fieldName],
              {cols: cols}
          )
        }, this)
        .concat([
          ReactSubmit({cols: cols})
        ])
      );
    },

    renderField: function(fieldName, config, props){
      props = $.extend({}, props, {config: config, fieldName: fieldName});

      console.log(config);

      switch(config.type){

        case 'array':
          return '';
          throw new Error('No array input available');

        case 'string':

          if(config.format === 'rich-html'){
            return ReactRichTextInput(props);
          }

          if(config.isEnum){
            return ReactSelect(props);
          }

          return ReactStringInput(props);

        case 'integer':

          if(config.isEnum){
            return ReactSelect(props);
          }

          return ReactStringInput(props);

        case 'boolean':
          return ReactCheckBox(props);

        default:
          break;
      }
      throw new Error();
    },

    onSubmit: function(event){
      alert('Submit');
      event.preventDefault();
    },

    onChange: function(event){
      alert(event.target.value);
    }
  }),


  ReactStringInput = React.createClass({

    displayName: 'StringInput',

    render: function(){
      var label = this.props.config.title,
          key = this.props.config.fieldName;

      return d.div({className: 'form-group'},
        [
          ReactHorizontalLabel({label: label, 'htmlFor': key, cols: this.props.cols}),
          d.div({className: 'col-lg-' + this.props.cols.left},
            d.input({name: key, key: key, type: 'text', className: 'form-control', required: '', value: 'foo'})
          )
        ]
      );
    }
  }),

  ReactHorizontalLabel = React.createClass({
    displayName: 'ReactHorizontalLabel',

    render: function(){
      return d.label({className: 'control-label col-lg-' + this.props.cols.left, htmlFor: this.props.htmlFor}, this.props.label)
    }
  }),

  ReactRichTextInput = React.createClass({
    displayName: 'ReactRichTextInput',

    render: function(){
      var wrapperClassName = 'col-lg-' + this.props.cols.right;

      return d.div({className: 'form-group'},
        [
          ReactHorizontalLabel({label: 'ReactRichTextInput', htmlFor: 'key', cols: this.props.cols}),
          d.div({className: wrapperClassName},
            d.textarea({name: 'key', className: 'form-control', rows: '5', required: ''})
          )
        ]
      )
    }
  }),

  ReactSubmit = React.createClass({
    displayName: 'ReactSubmit',

    render: function(){
      var wrapperClassName = ['col-lg-offset-' + this.props.cols.left, 'col-lg-' + this.props.cols.right].join(' ');
      return d.div({className: 'form-group'},
        d.div({className: wrapperClassName},
          d.input({type: 'submit', value: 'submit', className: 'btn btn-default'}))
      )
    }
  }),

  ReactSelect = React.createClass({
    displayName: 'ReactSelect',

    render: function(){
      var options = [
        ['One', 1],
        ['Two', 2],
        ['Three', 3]
      ],
      wrapperClassName  = ['col-lg-' + this.props.cols.right].join(' ');

      return d.div({className: 'form-group'}, [
        ReactHorizontalLabel({label: 'ReactSelect', htmlFor: 'key', cols: this.props.cols}),
        d.div({className: wrapperClassName},
          d.select({name: 'name', className: 'form-control', required: ''},
            options.map(function(choice){
              return d.option({value: choice[1]}, choice[0])
            })
          )
        )
      ]);
    }
  }),

  ReactCheckBox = React.createClass({

    displayName: 'ReactCheckBox',

    render: function(){
      var wrapperClassName = ['col-lg-offset-' + this.props.cols.left, 'col-lg-' + this.props.cols.right].join(' ');
      return d.div({className: 'form-group'},
        d.div({className: wrapperClassName},
          d.div({className: 'checkbox'},
            d.label({}, [
              d.input({name: 'name', type: 'checkbox', required: ''}),
              'ReactCheckBox'
            ])
          )
        )
      )
    }
  });

  /**
   * Merge a form config with a proper JSON schema, giving the full
   * configuration needed to create a working dynamic form.
   *
   * @param formConfig {object}
   * @param schema {object}
   */
  function mergeConfigs(schema, formConfig) {
    var deep = true;
    return $.extend(deep, {}, schema, formConfig);
  }

  function exists(val){
    return !(val === undefined || val === null);
  }

  function stringInputType(property){
    switch(property.type){
      case 'string':
        switch (property.format){
          case "date-time": return "date-time";
          case "rich-html": return "text";
        }
        return "text";
      case 'array':   return "text";
      case 'integer': return "number";
      default: throw new Error('Type not supported: "' + [property.type, property.format] + '"');
    }
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

//  Form.prototype.init = function(config, ctx){
//    var formTypes, orderedFields;
//
//    this.$el = $('<form></form>');
//    this.fields = {};
//
//    formTypes = ['form-horizontal'];
//
//    if(formTypes.indexOf(ctx.formType) < 0){
//      throw new Error('Bootstrap form type must be one of ' + formTypes);
//    }
//
//    this.$el.attr({
//      role: 'form',
//      class: ctx.formType
//    });
//
//    if(exists(config.order)){
//      orderedFields = config.order;
//    } else {
//      orderedFields = $.map(config.properties, function(fieldName){return fieldName});
//    }
//
//    $.each(orderedFields, $.proxy(function(index, fieldName){
//      var required, field, property;
//
//      property = config.properties[fieldName];
//      required = config.required.indexOf(fieldName) >= 0;
//
//      field = renderItem(
//          property.type, property.format, exists(property.enum), fieldName, property, required, ctx);
//
//      this.fields[fieldName] = field;
//      this.$el.append(field.$el);
//    }, this));
//
//    this.$el.append(renderSubmit(ctx));
//  };

//  Form.prototype.setData = function(data){
//    this.data = data;
//
//    if(!$.isEmptyObject(this.data)){
//      $.each(this.fields, $.proxy(function(key, field){
//        if(this.data.hasOwnProperty(key)){
//          field.set(this.data[key]);
//        }
//      }, this));
//    }
//  };
//
//  Form.prototype.getData = function(){
//    var data = {};
//    $.each(this.fields, $.proxy(function(key, field){
//      data[key] = field.get();
//    }, this));
//    return data;
//  };


  function validateChoices(formChoices, enumChoices){
    var arr1, arr2;

    arr1 = $.map(formChoices, function(item){return item[1]});
    arr1.sort();

    arr2 = enumChoices.slice();
    arr2.sort();

    if(!arraysEqual(arr1, arr2)){
      throw new Error('Form choices do not match the enum specified on the schema');
    }
  }

  return {
    Dynoform: Dynoform,
    mergeConfigs: mergeConfigs
  };

});
