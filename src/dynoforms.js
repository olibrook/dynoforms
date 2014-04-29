
define(['jquery', 'react'], function($, React){

  'use strict';

  var d = React.DOM,

  ReactForm = React.createClass({

    displayName: 'Dynoform',

    setValue: function(data) {
      var k;
      for(k in this.refs){
        if(this.refs.hasOwnProperty(k) && data.hasOwnProperty(k)){
          this.refs[k].setValue(data[k]);
        }
      }
    },

    getValue: function() {
      var k,
          ret = {};

      for(k in this.refs){
        if(this.refs.hasOwnProperty(k)){
          ret[k] = this.refs[k].getValue();
        }
      }
      return ret;
    },

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
          ReactSubmit({key: 'submit', cols: cols})
        ])
      );
    },

    renderField: function(fieldName, config, props){

      config = $.extend({}, config, {
        fieldName: fieldName,
        required: this.props.config.required.indexOf(fieldName) >= 0
      });

      props = $.extend({}, props, {
        config: config,
        key: config.fieldName,
        ref: fieldName
      });

      switch(config.type){

        case 'array':
          // TODO: Need a usable, comma-separated field.
          return '';
          throw new Error('No array input available');

        case 'string':

          if(config.format === 'rich-html'){
            return ReactRichTextInput(props);
          }

          if(config.enum){
            return ReactSelect(props);
          }

          return ReactStringInput(props);

        case 'integer':

          if(config.enum){
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

    getInitialState: function(){
      return {value: ''}
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var label = this.props.config.title,
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count++;
      }

      return d.div({className: 'form-group'},
        [
          ReactHorizontalLabel({key: key(), label: label, 'htmlFor': fieldName, cols: this.props.cols}),
          d.div({key: key(), className: 'col-lg-' + this.props.cols.left},
            d.input({
              id: fieldName,
              name: fieldName,
              type: this.getType(this.props.config),
              className: 'form-control',
              required: this.props.config.required,
              value: this.state.value,
              onChange: function(e){this.setState({value: e.target.value});}
            })
          )
        ]
      );
    },

    getType: function(config){
      switch(config.type){
        case 'string':
          switch (config.format){
            case "date-time": return "date-time";
            case "rich-html": return "text";
          }
          return "text";
        case 'array':   return "text";
        case 'integer': return "number";
        default: throw new Error('Type not supported: "' + [config.type, config.format] + '"');
      }
    }
  }),

  ReactHorizontalLabel = React.createClass({
    displayName: 'ReactHorizontalLabel',

    render: function(){
      return d.label({
          className: 'control-label col-lg-' + this.props.cols.left,
          htmlFor: this.props.htmlFor
        },
        this.props.label
      )
    }
  }),

  ReactRichTextInput = React.createClass({
    displayName: 'ReactRichTextInput',

    getInitialState: function(){
      return {value: ''}
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var wrapperClassName = 'col-lg-' + this.props.cols.right,
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count ++;
      }

      return d.div({className: 'form-group', key: fieldName},
        [
          ReactHorizontalLabel({key: key(), label: 'ReactRichTextInput', htmlFor: fieldName, cols: this.props.cols}),
          d.div({key: key(), className: wrapperClassName},
            d.textarea({
              id: fieldName,
              name: fieldName,
              className: 'form-control',
              rows: '10',
              required: this.props.config.required,
              value: this.state.value,
              onChange: function(e){this.setState({value: e.target.value});}
            })
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
          d.input({
            type: 'submit',
            value: 'submit',
            className: 'btn btn-default'
          })
        )
      )
    }
  }),

  ReactSelect = React.createClass({
    displayName: 'ReactSelect',

    // TODO: Pick sensible default
    getInitialState: function(){
      return {value: ''}
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var wrapperClassName  = ['col-lg-' + this.props.cols.right].join(' '),
          options,
          i,
          label = this.props.config.title,
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count++;
      }

      if(this.props.config.choices){
        options = this.props.config.choices;
      } else {
        options = [];
        for(i=0; i<this.props.config.enum.length; i+=1){
          options.push([this.props.config.enum[i], this.props.config.enum[i]]);
        }
      }

      this.validateChoices(options, this.props.config.enum);

      return d.div({className: 'form-group', key: fieldName}, [
        ReactHorizontalLabel({key: key(), label: label, htmlFor: fieldName, cols: this.props.cols}),
        d.div({key: key(), className: wrapperClassName},
          d.select(
            {
              id: fieldName,
              name: fieldName,
              className: 'form-control',
              required: this.props.config.required,
              value: this.state.value,
              onChange: function(e){this.setState({value: e.target.value});}
            },
            options.map(function(choice){
              return d.option({key: key(), value: choice[1]}, choice[0])
            })
          )
        )
      ]);
    },

    /**
     * Ensure the choices specified on the form match that on a schema's enum property.
     */
    validateChoices: function(formChoices, enumChoices){
      var arr1, arr2;

      arr1 = $.map(formChoices, function(item){return item[1]});
      arr1.sort();

      arr2 = enumChoices.slice();
      arr2.sort();

      if(!arraysEqual(arr1, arr2)){
        throw new Error('Form choices do not match the enum specified on the schema');
      }
    }
  }),

  ReactCheckBox = React.createClass({

    displayName: 'ReactCheckBox',

    getInitialState: function(){
      return {value: ''}
    },

    setValue: function(value){
      if(value === true){
        value = 'checked';
      } else if(value === false){
        value = '';
      } else {
        throw new Error();
      }
      this.setState({value: value});
    },

    getValue: function(){
      var value = this.state.value;

      if(value === 'checked'){
        return true;
      } else if(value === ''){
        return false;
      } else {
        throw new Error();
      }
    },

    render: function(){
      var wrapperClassName = ['col-lg-offset-' + this.props.cols.left, 'col-lg-' + this.props.cols.right].join(' '),
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count++;
      }

      return d.div({className: 'form-group'},
        d.div({className: wrapperClassName},
          d.div({className: 'checkbox'},
            d.label({}, [
              d.input({
                name: fieldName,
                id: fieldName,
                type: 'checkbox',
                key: key(),
                required: this.props.config.required,
                checked: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}
              }),
              d.span({key: key()}, this.props.config.title)
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

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  return {
    Dynoform: ReactForm,
    mergeConfigs: mergeConfigs
  };

});
