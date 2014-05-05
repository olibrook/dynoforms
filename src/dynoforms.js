
define(['jquery', 'react'], function($, React){

  'use strict';

  var

  d = React.DOM,

  /**
   * A JSON-schema configurable form.
   */
  Form = React.createClass({

    statics: {

      /**
       * Recursive rendering function, returns a React component which
       * implements FormComponent and is a field or collection of fields.
       *
       * This is the main rendering function. Called recursively it renders
       * entire forms.
       *
       * All Form components must implement this interface:
       *
       *     getValue: function(){},
       *     setValue: function(value){},
       *     setErrors: function(errors){}
       *
       * @param config Object, config for the field/collection
       * @param props Object, props for the created component
       */
      renderRecursive: function(config, props){

        if((props.key === undefined) || (props.ref === undefined)){
          throw new Error('Props requires key and ref');
        }

        config = $.extend({}, config, {
          required: false, // TODO: broken
          fieldName: props.ref // TODO: Probably not necessary. Move this on to props.
        });

        props = $.extend({}, props, {
          config: config
        });

        switch(config.type){

          case 'object':
            return new FieldSet(props);

          case 'array':
            if(['string', 'integer', 'number'].indexOf(config.items.type) >= 0){
              return new CommaSeparatedInput(props);
            } else {
              return new ArrayInput(props);
            }

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
      }
    },

    displayName: 'Form',
    ROOT_REF: 'root',

    setValue: function(data){
      this.refs[this.ROOT_REF].setValue(data);
    },

    getValue: function(){
      return this.refs[this.ROOT_REF].getValue();
    },

    setErrors: function(data){
      this.refs[this.ROOT_REF].setErrors(data);
    },

    onSubmit: function(event){
      event.preventDefault();
    },

    onChange: function(event){
      alert(event.target.value);
    },

    render: function() {
      var cols = {
          left: 2,
          right: 10
        };

      return d.form({onSubmit: this.onSubmit, className: 'form-horizontal', role: 'form'},
        [
          Form.renderRecursive(this.props.config, {
            cols: cols,
            ref: this.ROOT_REF,
            key: this.ROOT_REF
          }),
          new Submit({
            cols: cols,
            key: 'submit'
          })
        ]
      );
    }
  }),

  /**
   * A mixin for simple single-valued fields.
   *
   * Components using this mixin should define getValue() and
   * setValue() which must handle conversion between JSON values
   * and the values actually set on a Form component.
   */
  SimpleInputMixin = {

    getInitialState: function(){
      return {
        value: '',
        error: null
      }
    },

    setErrors: function(errors){
      this.setState({error: errors});
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          label = this.props.config.title,
          fieldName = this.props.config.fieldName;

      return d.div({className: className},
        [
          HorizontalLabel({key: 'label', label: label, 'htmlFor': fieldName, cols: this.props.cols}),
          d.div({key: 'wrapper', className: 'col-lg-' + this.props.cols.right},
            [
              this.state.error ? HelpText({helpText: this.state.error, key: 'error'}) : '',
              d.input({
                id: fieldName,
                name: fieldName,
                key: fieldName,
                type: this.getInputType(),
                className: 'form-control',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              }),
              this.props.config.helpText ? HelpText({helpText: this.props.config.helpText, key: 'help-text'}) : ''
            ]
          )
        ]
      );
    }
  },

  /**
   * A collection of fields on a form. These can be nested for complex
   * representations of objects. The value of a FieldSet is always an
   * Object.
   *
   * FieldSet instances support a special error value for '__all__'
   * which is used to indicate non-field errors for an object, similar
   * to a Django Form.
   */
  FieldSet = React.createClass({
    displayName: 'FieldSet',

    getInitialState: function(){
      return {
        error: null
      }
    },

    setErrors: function(data){
      var k,
          fieldError,
          nonFieldError;

      for(k in this.refs){
        if(this.refs.hasOwnProperty(k)){
          fieldError = data.hasOwnProperty(k) ? data[k] : null;
          this.refs[k].setErrors(data[k]);
        }
      }

      nonFieldError = data.hasOwnProperty('__all__') ? data['__all__'] : null;
      this.setState({error: nonFieldError});
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
      var children,
          orderedFields;

      children = [];
      orderedFields = this.getFieldOrder();

      if(this.state.error){
        children.push(
          d.div({
            key: 'non-field-errors',
            className: 'alert alert-danger',
            style: {textAlign: 'center'}
          }, this.state.error)
        )
      }

      children = children.concat(
        orderedFields.map(function(fieldName){
          var childProps = {
            key: fieldName,
            ref: fieldName,
            cols: this.props.cols
          };
          return Form.renderRecursive(
              this.props.config.properties[fieldName],
              childProps
          )
        }, this)
      );
      return d.fieldset({}, children);
    },

    /**
     * Work out field ordering, if specified.
     */
    getFieldOrder: function(){
      var orderedFields, key;

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
      return orderedFields;
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

  CommaSeparatedInput = React.createClass({
    displayName: 'CommaSeparatedInput',
    mixins: [SimpleInputMixin],

    toForm: function(value){
      return value.join(', ');
    },

    toJS: function(value){
      var type = this.props.config.items.type;

      return value.split(', ').map(function(v){
        if(type === 'string'){
          return v;
        }
        else if(type === 'integer'){
          return parseInt(v, 10);
        }
        else if(type === 'number'){
          return parseFloat(v);
        }
        else {throw new Error('Invalid type for comma seperated input, ' + type);}
      }, this);
    },

    getInputType: function(){
      return 'text';
    },

    setValue: function(value){
      this.setState({value: this.toForm(value)});
    },

    getValue: function(){
      return this.toJS(this.state.value);
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

    setErrors: function(errors){
      var i;
      for(i=0; i<errors.length; i+=1){
        this.refs[i.toString()].setErrors(errors[i]);
      }
    },

    render: function(){
      var items,
          i,
          childProps;

      items = [];

      for(i=0; i<this.state.count; i+=1){
        childProps = {
          key: i.toString(),
          ref: i.toString(),
          cols: this.props.cols
        };
        items.push(
          Form.renderRecursive(
              this.props.config.items,
              childProps
          )
        )
      }
      return d.div({className: 'form-group'},
        [
          HorizontalLabel({label: this.props.config.title, cols: this.props.cols, key: 'label'}),
          d.div({className: 'col-lg-' + this.props.cols.right, key: 'content'},
            d.div({className: 'array-items'},
              items.concat([
                  d.div({className: 'form-group', key: 'add-item'},
                    d.div({className: 'col-lg-12', style: {textAlign: 'right'}},
                      d.button({type: 'button', className: 'btn btn-default', onClick: this.onAddItemClick},
                        [
                          d.span({className: 'glyphicon glyphicon-plus'}),
                          ' Add'
                        ]
                      )
                    )
                  )
                ]
              )
            )
          )
        ]
      )
    },

    onAddItemClick: function(e){
      e.preventDefault();
      this.setState({count: this.state.count + 1});
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

    setErrors: function(errors){
      this.setState({error: errors});
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName = 'col-lg-' + this.props.cols.right,
          fieldName = this.props.config.fieldName,
          label = this.props.config.title;

      return d.div({className: className, key: fieldName},
        [
          HorizontalLabel({key: 'label', label: label, htmlFor: fieldName, cols: this.props.cols}),
          d.div({key: 'wrapper', className: wrapperClassName},
            [
              this.state.error ? HelpText({helpText: this.state.error, key: 'error'}) : '',
              d.textarea({
                id: fieldName,
                name: fieldName,
                key: fieldName,
                className: 'form-control',
                rows: '10',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              }),
              this.props.config.helpText ? HelpText({helpText: this.props.config.helpText, key: 'help-text'}) : ''
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
        d.div({className: wrapperClassName, style: {textAlign: 'right'}},
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

    setErrors: function(errors){
      this.setState({error: errors});
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName  = ['col-lg-' + this.props.cols.right].join(' '),
          options,
          i,
          label = this.props.config.title,
          fieldName = this.props.config.fieldName;

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
        HorizontalLabel({key: 'label', label: label, htmlFor: fieldName, cols: this.props.cols}),
        d.div({key: 'wrapper', className: wrapperClassName},
          [
            this.state.error ? HelpText({helpText: this.state.error, key: 'help-text'}) : '',
            d.select(
              {
                id: fieldName,
                name: fieldName,
                key: fieldName,
                className: 'form-control',
                required: this.props.config.required,
                value: this.state.value,
                onChange: function(e){this.setState({value: e.target.value});}.bind(this)
              },
              options.map(function(choice){
                return d.option({key: choice[1], value: choice[1]}, choice[0])
              })
            ),
            this.props.config.helpText ? HelpText({helpText: this.props.config.helpText, key: 'help-text'}) : ''
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

    setErrors: function(errors){
      this.setState({error: errors});
    },

    render: function(){
      var className = ['form-group', this.state.error ? 'has-error' : ''].join(' '),
          wrapperClassName = ['col-lg-offset-' + this.props.cols.left, 'col-lg-' + this.props.cols.right].join(' '),
          fieldName = this.props.config.fieldName;

      return d.div({className: className},
        d.div({className: wrapperClassName},
          d.div({className: 'checkbox'},
            d.label({},
              [
                this.state.error ? HelpText({helpText: this.state.error, key: 'error'}) : '',
                d.input({
                  type: 'checkbox',
                  name: fieldName,
                  id: fieldName,
                  key: fieldName,
                  required: this.props.config.required,
                  checked: this.state.value,
                  onChange: function(e){this.setState({value: e.target.checked});}.bind(this)
                }),
                d.span({key: 'label-text'}, this.props.config.title),
                this.props.config.helpText ? HelpText({helpText: this.props.config.helpText, key: 'help-text'}) : ''
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
    Form: Form,
    mergeConfigs: mergeConfigs
  };

});
