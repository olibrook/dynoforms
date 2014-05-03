
define(['jquery', 'react'], function($, React){

  'use strict';

  var d = React.DOM,

  Form = React.createClass({

    displayName: 'Form',

    getInitialState: function(){
      return {
        error: null // Non-field errors
      }
    },

    setErrors: function(data){
      var k,
          error;
      for(k in this.refs){
        if(this.refs.hasOwnProperty(k)){
          if(data.hasOwnProperty(k)){
            error = data[k];
          } else {
            error = null;
          }
          this.refs[k].setState({error: data[k]});
        }
      }
      if(data.hasOwnProperty('__all__')){
        error = data['__all__']
      } else {
        error = null;
      }
      this.setState({error: error});
    },

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
          renderedFields,
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

      renderedFields = orderedFields.map(function(fieldName){
        return this.renderField(
            fieldName,
            this.props.config.properties[fieldName],
            {cols: cols}
        )
      }, this);

      return d.form({onSubmit: this.onSubmit, className: 'form-horizontal', role: 'form'},
        [
          this.state.error ? d.p({className: 'bg-danger', style: {textAlign: 'center'}}, this.state.error) : ''
        ]
        .concat(
          renderedFields
        )
        .concat([
          Submit({key: 'submit', cols: cols})
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
          return ArrayInput(props);

        case 'string':
          if(config.format === 'rich-html'){
            return RichTextInput(props);
          }
          if(config.enum){
            return Select(props);
          }
          return TextInput(props);

        case 'integer':
          if(config.enum){
            return Select(props);
          }
          return NumberInput(props);

        case 'boolean':
          return CheckBox(props);

        default:
          break;
      }
      throw new Error();
    },

    onSubmit: function(event){
      event.preventDefault();
    },

    onChange: function(event){
      alert(event.target.value);
    }
  }),

  SimpleInputMixin = {

    getInitialState: function(){
      return {
        value: '',
        error: null
      }
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          label = this.props.config.title,
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count++;
      }

      return d.div({className: className},
        [
          HorizontalLabel({key: key(), label: label, 'htmlFor': fieldName, cols: this.props.cols}),
          d.div({key: key(), className: 'col-lg-' + this.props.cols.left},
            [
              this.state.error ? HelpText({helpText: this.state.error}) : '',
              d.input({
                id: fieldName,
                name: fieldName,
                type: this.getInputType(),
                className: 'form-control',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              }),
              this.props.config.helpText ? HelpText({helpText: this.props.config.helpText}) : ''
            ]
          )
        ]
      );
    }
  },

  TextInput = React.createClass({

    displayName: 'TextInput',

    mixins: [SimpleInputMixin],

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    getInputType: function(){
      return 'text';
    }
  }),

  DateTimeInput = React.createClass({

    displayName: 'DateTimeInput',

    mixins: [SimpleInputMixin],

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    getInputType: function(){
      return 'datetime';
    }
  }),

  NumberInput = React.createClass({

    displayName: 'NumberInput',

    mixins: [SimpleInputMixin],

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    getInputType: function(){
      return 'number';
    }
  }),

  ArrayInput = React.createClass({

    displayName: 'ArrayInput',

    mixins: [SimpleInputMixin],

    setValue: function(value){
      this.setState({value: value.join(', ')});
    },

    getValue: function(){
      return this.state.value.split(', ');
    },

    getInputType: function(){
      return 'text';
    }
  }),


  HorizontalLabel = React.createClass({
    displayName: 'HorizontalLabel',

    render: function(){
      return d.label({
          className: 'control-label col-lg-' + this.props.cols.left,
          htmlFor: this.props.htmlFor
        },
        this.props.label
      )
    }
  }),

  HelpText = React.createClass({
    displayName: 'HelpText',

    render: function(){
      return d.span({className: 'help-block'}, this.props.helpText)
    }
  }),

  RichTextInput = React.createClass({
    displayName: 'RichTextInput',

    getInitialState: function(){
      return {
        value: '',
        error: null
      }
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName = 'col-lg-' + this.props.cols.right,
          fieldName = this.props.config.fieldName,
          label = this.props.config.title,
          count = 0;

      function key(){
        return fieldName + count ++;
      }

      return d.div({className: className, key: fieldName},
        [
          HorizontalLabel({key: key(), label: label, htmlFor: fieldName, cols: this.props.cols}),
          d.div({key: key(), className: wrapperClassName},
            [
              this.state.error ? HelpText({helpText: this.state.error}) : '',
              d.textarea({
                id: fieldName,
                name: fieldName,
                className: 'form-control',
                rows: '10',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              }),
              this.props.config.helpText ? HelpText({helpText: this.props.config.helpText}) : ''
            ]
          )
        ]
      )
    }
  }),

  Submit = React.createClass({
    displayName: 'Submit',

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

  Select = React.createClass({
    displayName: 'Select',

    // TODO: Pick sensible default
    getInitialState: function(){
      return {
        value: '',
        error: null
      }
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName  = ['col-lg-' + this.props.cols.right].join(' '),
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

      return d.div({className: className, key: fieldName}, [
        HorizontalLabel({key: key(), label: label, htmlFor: fieldName, cols: this.props.cols}),
        d.div({key: key(), className: wrapperClassName},
          [
            this.state.error ? HelpText({helpText: this.state.error}) : '',
            d.select(
              {
                id: fieldName,
                name: fieldName,
                className: 'form-control',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              },
              options.map(function(choice){
                return d.option({key: key(), value: choice[1]}, choice[0])
              })
            ),
            this.props.config.helpText ? HelpText({helpText: this.props.config.helpText}) : ''
          ]
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

  CheckBox = React.createClass({

    displayName: 'CheckBox',

    getInitialState: function(){
      return {
        value: '',
        error: null
      }
    },

    setValue: function(value){
      this.setState({value: value});
    },

    getValue: function(){
      return this.state.value;
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName = ['col-lg-offset-' + this.props.cols.left, 'col-lg-' + this.props.cols.right].join(' '),
          fieldName = this.props.config.fieldName,
          count = 0;

      function key(){
        return fieldName + count++;
      }

      return d.div({className: className},
        d.div({className: wrapperClassName},
          d.div({className: 'checkbox'},
            d.label({},
              [
                this.state.error ? HelpText({helpText: this.state.error}) : '',
                d.input({
                  name: fieldName,
                  id: fieldName,
                  type: 'checkbox',
                  key: key(),
                  required: this.props.config.required,
                  checked: this.state.value,
                  onChange: function(e){this.setState({value: e.target.checked});}.bind(this)
                }),
                d.span({key: key()}, this.props.config.title),
                this.props.config.helpText ? HelpText({helpText: this.props.config.helpText}) : ''
              ]
            )
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
    Dynoform: Form,
    mergeConfigs: mergeConfigs
  };

});
