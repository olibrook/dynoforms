
define(['jquery', 'react'], function($, React){

  'use strict';

  var

  d = React.DOM,

  /**
   * Recursive field renderer
   */
  render = function(ref, config, layoutParams){
    var props;

    config = $.extend({}, config, {
      required: false, // TODO: broken
      fieldName: ref // TODO: Probably not necessary
    });

    props = $.extend({}, layoutParams, {
      config: config,
      ref: ref
    });

    switch(config.type){

      case 'object':
        return new FieldSet(props);

      case 'array':
        return new ArrayInput(props);

      case 'string':
        if(config.format === 'rich-html'){
          return new RichTextInput(props);
        }
        if(config.enum){
          return new Select(props);
        }
        return new TextInput(props);

      case 'integer':
        if(config.enum){
          return new Select(props);
        }
        return new NumberInput(props);

      case 'boolean':
        return new CheckBox(props);

      default:
        break;
    }
    throw new Error();
  },

  Form = React.createClass({

    displayName: 'Form',

    ROOT_REF: 'root',

    getInitialState: function(){
      return {
        error: null // Non-field errors
      }
    },

    setValue: function(data){
      this.refs[this.ROOT_REF].setValue(data);
    },

    getValue: function(data){
      return this.refs[this.ROOT_REF].getValue();
    },

    setErrors: function(data){
      var error;

      this.refs[this.ROOT_REF].setErrors(data);

      if(data.hasOwnProperty('__all__')){
        error = data['__all__']
      } else {
        error = null;
      }
      this.setState({error: error});
    },

    getErrors: function(){
      this.refs[this.ROOT_REF].getErrors();
    },

    onSubmit: function(event){
      event.preventDefault();
    },

    onChange: function(event){
      alert(event.target.value);
    },

    render: function() {
      var layoutConfig = {
        cols: {
          left: 2,
          right: 10
        }
      };

      return d.form({onSubmit: this.onSubmit, className: 'form-horizontal', role: 'form'}, [
          this.state.error ? d.p({className: 'bg-danger', style: {textAlign: 'center'}}, this.state.error) : '',
          render(this.ROOT_REF, this.props.config, layoutConfig),
          new Submit(layoutConfig)
      ]);
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
          d.div({key: key(), className: 'col-lg-' + this.props.cols.right},
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

  FieldSet = React.createClass({
    displayName: 'FieldSet',

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

    render: function() {
      var orderedFields,
          key,
          layoutConfig;

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

      layoutConfig = {cols: this.props.cols};

      return d.fieldset({},
          orderedFields.map(function(fieldName){
            return render(
                fieldName,
                this.props.config.properties[fieldName],
                layoutConfig
            )
          }, this)
      );
    }
  }),

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

    getInitialState: function(){
      return {
        count: 0
      }
    },

    setValue: function(value){
      var i,
          item;

      this.setState({count: value.length});
      for(i=0; i<value.length; i+=1){
        item = this.refs[i.toString()];
        item.setValue(value[i]);
      }
    },

    getValue: function(){
      var i,
          value;
      value = [];
      for(i=0; i<this.state.count; i+=1){
        value.push(this.refs[i.toString()].getValue());
      }
      return value;
    },

    render: function(){
      var items,
          i,
          layoutConfig,
          props;


      layoutConfig = {cols: this.props.cols};

      items = [];

      for(i=0; i<this.state.count; i+=1){
        props = $.extend({}, this.props.config.items, {
          title: i.toString()
        });
        items.push(
          render(
              i.toString(),
              props,
              layoutConfig
          )
        )
      }
      return d.div({className: 'form-group'},
        [HorizontalLabel({label: this.props.config.title, cols: this.props.cols})],
        d.div({className: 'col-lg-' + this.props.cols.right},
          items.concat([
              d.div({className: 'col-lg-' + this.props.cols.left}, ''),
              d.div({className: 'col-lg-' + this.props.cols.right},
                d.a({style: {display: 'block'}}, "Add another item")
              )
            ]
          )
        )
      )
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
