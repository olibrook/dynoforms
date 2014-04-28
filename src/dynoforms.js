
define(['jquery'], function($){

  'use strict';

  /**
   * Factory function for form fields
   *
   * Args:
   *   (type, format, isEnum, id, item, required, ctx)
   */
  function renderItem(type, format, isEnum, id, item, required, ctx){

    switch(type){

      case 'array':
        return new ArrayInput(id, item, required, ctx);

      case 'string':

        if(format === 'rich-html'){
          return new RichTextInput(id, item, required, ctx);
        }

        if(isEnum){
          return new Select(id, item, required, ctx);
        }

        return new StringInput(id, item, required, ctx);

      case 'integer':

        if(isEnum){
          return new Select(id, item, required, ctx);
        }

        return new StringInput(id, item, required, ctx);

      case 'boolean':
        return new Checkbox(id, item, required, ctx);

      default:
        break;
    }
    throw new Error();
  }

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

  function renderSubmit(ctx){
    var wrapperClasses = ['col-lg-offset-' + ctx.leftCols, 'col-lg-' + ctx.rightCols].join(' ');

    return $(
        '<div class="form-group">' +
          '<div class="' + wrapperClasses +'">' +
            '<button type="submit" class="btn btn-default">Save</button>' +
          '</div>' +
        '</div>'
    );
  }

  function renderHorizontalLabel(key, property, leftCols){
    var classAttr = " class='" + ['control-label', 'col-lg-' + leftCols].join(' ') + "'";
    return renderLabel(key, property, classAttr);
  }

  function renderLabel(key, property, classAttr){
    return "<label" + classAttr + " for='" + key + "'>" + readableTitle(key, property) + "</label>";
  }

  function readableTitle(key, property){
    return property.title || key;
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

  /**
   * Dynamic Form class, configurable using a JSON schema.
   *
   * @param schema {object} a JSON schema object
   * @param formConfig {object} a form config
   * @param data {object} the data set on the form
   * @constructor
   */
  function Form(schema, formConfig, data){
    this.$el = null;
    this.fields = null;
    this.config = mergeConfigs(schema, formConfig);
    this.data = null;
    this.init(this.config, {
      formType: 'form-horizontal',
      leftCols: 3,
      rightCols: 9
    });

    if(exists(data)){
      this.setData(data);
    }
  }

  Form.prototype.init = function(config, ctx){
    var formTypes, orderedFields;

    this.$el = $('<form></form>');
    this.fields = {};

    formTypes = ['form-horizontal'];

    if(formTypes.indexOf(ctx.formType) < 0){
      throw new Error('Bootstrap form type must be one of ' + formTypes);
    }

    this.$el.attr({
      role: 'form',
      class: ctx.formType
    });

    if(exists(config.order)){
      orderedFields = config.order;
    } else {
      orderedFields = $.map(config.properties, function(fieldName){return fieldName});
    }

    $.each(orderedFields, $.proxy(function(index, fieldName){
      var required, field, property;

      property = config.properties[fieldName];
      required = config.required.indexOf(fieldName) >= 0;

      field = renderItem(
          property.type, property.format, exists(property.enum), fieldName, property, required, ctx);

      this.fields[fieldName] = field;
      this.$el.append(field.$el);
    }, this));

    this.$el.append(renderSubmit(ctx));
  };

  Form.prototype.setData = function(data){
    this.data = data;

    if(!$.isEmptyObject(this.data)){
      $.each(this.fields, $.proxy(function(key, field){
        if(this.data.hasOwnProperty(key)){
          field.set(this.data[key]);
        }
      }, this));
    }
  };

  Form.prototype.getData = function(){
    var data = {};
    $.each(this.fields, $.proxy(function(key, field){
      data[key] = field.get();
    }, this));
    return data;
  };

  function simpleGet(){
    return this.$formControl.val();
  }

  function simpleSet(val){
    return this.$formControl.val(val);
  }

  function StringInput(id, item, required, ctx){
    this.$formControl = null;
    this.$el = null;
    this.init(id, item, required, ctx);
  }

  StringInput.prototype.init = function(id, item, required, ctx){
    var wrapperClasses;
    wrapperClasses = ['col-lg-' + ctx.rightCols].join(' ');
    this.$el = $(
        "<div class='form-group'>" +
          renderHorizontalLabel(id, item, ctx.leftCols) +
          "<div class='" + wrapperClasses +"'>" +
            "<input " +
              "name='" + readableTitle(id, item) + "' " +
              "type='" + stringInputType(item) + "' " +
              "id='" + id + "' " +
              "class='form-control'" +
              (required ? "required" : "") +
            "/>" +
          "</div>" +
        "</div>"
    );
    this.$formControl  = $(this.$el.find('input'));
  };

  StringInput.prototype.get = simpleGet;

  StringInput.prototype.set = simpleSet;

  function RichTextInput(id, item, required, ctx){
    this.$formControl = null;
    this.$el = null;
    this.init(id, item, required, ctx);
  }

  RichTextInput.prototype.init = function(id, item, required, ctx){
    var wrapperClasses;

    wrapperClasses = ['col-lg-' + ctx.rightCols].join(' ');

    this.$el = $(
        "<div class='form-group'>" +
          renderHorizontalLabel(id, item, ctx.leftCols) +
          "<div class='" + wrapperClasses +"'>" +
            "<textarea " +
              "name='" + readableTitle(id, item) + "' " +
              "id='" + id + "' " +
              "class='form-control'" +
              "rows='5'" +
              (required ? "required" : "") +
            "/>" +
          "</div>" +
        "</div>"
    );
    this.$formControl = $(this.$el.find('textarea'));
  };

  RichTextInput.prototype.get = simpleGet;

  RichTextInput.prototype.set = simpleSet;


  function Select(id, item, required, ctx){
    this.$formControl = null;
    this.$el = null;
    this.init(id, item, required, ctx);
  }

  Select.prototype.init = function(id, item, required, ctx){
    var wrapperClasses, choices, options;

    wrapperClasses = ['col-lg-' + ctx.rightCols].join(' ');

    function createOption(memo, choice){
      return memo + "<option value='" + choice[1] +"'>" + choice[0] + "</option>";
    }

    if(item.hasOwnProperty('choices')){
      choices = item.choices;
    } else {
      choices = [];
      $.each(item.enum, function(index, value){
        choices.push([value, value]);
      });
    }
    options = choices.reduce(createOption, '');

    this.$el = $(
        "<div class='form-group'>" +
          renderHorizontalLabel(id, item, ctx.leftCols) +
          "<div class='" + wrapperClasses +"'>" +
            "<select " +
              "name='" + readableTitle(id, item) + "' " +
              "id='" + id + "' " +
              "class='form-control'" +
              (required ? "required" : "") +
            ">" +
              options +
            "</select>" +
          "</div>" +
        "</div>"
    );
    this.$formControl = $(this.$el.find('select'));
  };

  Select.prototype.get = simpleGet;

  Select.prototype.set = simpleSet;


  function Checkbox(id, item, required, ctx){
    this.$formControl = null;
    this.$el = null;
    this.init(id, item, required, ctx);
  }

  Checkbox.prototype.init = function(id, item, required, ctx){
    var inputType = 'checkbox',
        title = readableTitle(id, item),
        wrapperClasses = ['col-lg-offset-' + ctx.leftCols, 'col-lg-' + ctx.rightCols].join(' ');
    this.$el = $(
      '<div class="form-group">' +
        '<div class="' + wrapperClasses +'">' +
          '<div class="checkbox">' +
            '<label>' +
              "<input " +
                "name='" + title + "' " +
                "type='" + inputType + "' " +
                "id='" + id + "' " +
                (required ? "required" : "") +
              "/>" +
              title +
            '</label>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    this.$formControl = $(this.$el.find('input'));
  };

  Checkbox.prototype.get = function(){
    return this.$formControl.prop( "checked" );
  };

  Checkbox.prototype.set = function(val){
    if(val){
      this.$formControl.attr('checked', 'checked');
    } else {
      this.$formControl.removeAttr('checked');
    }
  };

  function ArrayInput(id, item, required, ctx){
    this.$el = null;
    this.$formControl = null;
    this.init(id, item, required, ctx);
  }

  ArrayInput.prototype.init = StringInput.prototype.init;

  ArrayInput.prototype.get = function(){
    return this.$formControl.val().split(', ');
  };

  ArrayInput.prototype.set = function(val){
    this.$formControl.val(val.join(', '));
  };

  return {
    Form: Form
  };

});
