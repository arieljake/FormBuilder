define([], function() {
  "use strict";
  var EventEmitter = (function() {
    function EventEmitter() {}
    var proto = EventEmitter.prototype,
        nativeIndexOf = Array.prototype.indexOf ? true : false;
    function indexOfListener(listener, listeners) {
      if (nativeIndexOf) {
        return listeners.indexOf(listener);
      }
      var i = listeners.length;
      while (i--) {
        if (listeners[i] === listener) {
          return i;
        }
      }
      return -1;
    }
    proto.getListeners = function(evt) {
      var events = this._events || (this._events = {});
      return events[evt] || (events[evt] = []);
    };
    proto.addListener = function(evt, listener) {
      var listeners = this.getListeners(evt);
      if (indexOfListener(listener, listeners) === -1) {
        listeners.push(listener);
      }
      return this;
    };
    proto.on = proto.addListener;
    proto.removeListener = function(evt, listener) {
      var listeners = this.getListeners(evt),
          index = indexOfListener(listener, listeners);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this._events[evt] = null;
        }
      }
      return this;
    };
    proto.off = proto.removeListener;
    proto.addListeners = function(evt, listeners) {
      return this.manipulateListeners(false, evt, listeners);
    };
    proto.removeListeners = function(evt, listeners) {
      return this.manipulateListeners(true, evt, listeners);
    };
    proto.manipulateListeners = function(remove, evt, listeners) {
      var i,
          value,
          single = remove ? this.removeListener : this.addListener,
          multiple = remove ? this.removeListeners : this.addListeners;
      if (typeof evt === 'object') {
        for (i in evt) {
          if (evt.hasOwnProperty(i) && (value = evt[i])) {
            if (typeof value === 'function') {
              single.call(this, i, value);
            } else {
              multiple.call(this, i, value);
            }
          }
        }
      } else {
        i = listeners.length;
        while (i--) {
          single.call(this, evt, listeners[i]);
        }
      }
      return this;
    };
    proto.removeEvent = function(evt) {
      if (evt) {
        this._events[evt] = null;
      } else {
        this._events = null;
      }
      return this;
    };
    proto.emitEvent = function(evt, args) {
      var listeners = this.getListeners(evt),
          i = listeners.length,
          response;
      while (i--) {
        response = args ? listeners[i].apply(null, args) : listeners[i]();
        if (response === true) {
          this.removeListener(evt, listeners[i]);
        }
      }
      return this;
    };
    proto.trigger = proto.emitEvent;
    proto.emit = proto.emitEvent;
    return EventEmitter;
  })();
  ;
  var ObjectDesc = function(obj, name, value, doDelete) {
    if (!obj || !name)
      return undefined;
    var objRef = obj;
    var nameParts = _.isArray(name) ? name : name.split(".");
    if (nameParts.length > 1) {
      while (nameParts.length > 1) {
        var curParent = objRef;
        var property = nameParts.shift();
        var index = parseInt(property);
        if (_.isArray(objRef) && !isNaN(index) && index.toString().length == property.length) {
          if (index < 0)
            property = objRef.length + index;
          else
            property = index;
        }
        objRef = objRef[property];
        if (objRef === undefined) {
          if (value === undefined) {
            return undefined;
          } else {
            objRef = curParent[property] = {};
          }
        }
      }
    }
    var finalProperty = nameParts.shift();
    if (doDelete === true)
      delete objRef[finalProperty];
    else if (value !== undefined)
      objRef[finalProperty] = value;
    else
      return objRef[finalProperty];
  };
  ;
  var Field = function(fieldDef) {
    this.fieldDef = fieldDef;
  };
  Field.prototype.getId = function() {
    return this.fieldDef.id;
  };
  Field.prototype.getLabel = function() {
    return this.fieldDef.label;
  };
  Field.prototype.getSubLabel = function() {
    return this.fieldDef.subLabel;
  };
  Field.prototype.getType = function() {
    return this.fieldDef.type;
  };
  Field.prototype.getNumericPrecision = function() {
    return this.fieldDef.precision;
  };
  Field.prototype.getLinkText = function() {
    return this.fieldDef.linkText;
  };
  Field.prototype.getInputDesc = function() {
    return this.fieldDef.inputDesc;
  };
  Field.prototype.getOptions = function() {
    return this.fieldDef.options;
  };
  Field.prototype.getOptionsUrl = function() {
    return this.fieldDef.optionsUrl;
  };
  Field.prototype.isRequired = function() {
    return this.fieldDef.isRequired === true;
  };
  Field.prototype.isHiddenInput = function() {
    return this.isOfType("hidden");
  };
  Field.prototype.isSubForm = function() {
    return this.isOfType("subForm");
  };
  Field.prototype.isCheckedField = function() {
    return this.isOfType("checkbox");
  };
  Field.prototype.isTextualField = function() {
    return this.isOfType(["text", "textarea", "number"]);
  };
  Field.prototype.isNumericField = function() {
    return this.isOfType("number");
  };
  Field.prototype.isRequiredTextField = function() {
    return this.isRequired() && this.isTextualField();
  };
  Field.prototype.isIntegerField = function() {
    var precision = this.getNumericPrecision();
    return this.isOfType("number") && (precision === undefined || precision === 0);
  };
  Field.prototype.isDecimalField = function() {
    var precision = this.getNumericPrecision();
    return this.isOfType("number") && (precision !== undefined && precision > 0);
  };
  Field.prototype.isOfType = function(types) {
    if (typeof types == "string")
      types = [types];
    return types.indexOf(this.getType()) >= 0;
  };
  ;
  var Form = function(formElement, loader, validator) {
    this.formElement = formElement;
    this.loader = loader;
    this.validator = validator;
    this.attachToSubmitButton();
    this.attachToCancelButton();
  };
  Form.prototype = Object.create(EventEmitter.prototype);
  Form.prototype.attachToSubmitButton = function() {
    var self = this;
    this.formElement.find("#submitButton").bind("click", function(e) {
      var values = self.loader.pullValues();
      var errors = self.validator.validate(values);
      if (_.keys(errors).length > 0)
        self.onInvalidForm(values, errors);
      else
        self.onSubmit(values);
    });
  };
  Form.prototype.attachToCancelButton = function() {
    var self = this;
    this.formElement.find("#cancelButton").bind("click", function(e) {
      self.onCancel();
    });
  };
  Form.prototype.getRecord = function() {
    return this.record;
  };
  Form.prototype.loadRecord = function(record) {
    this.record = record || {};
    this.loader.loadForm(this.record);
  };
  Form.prototype.updateRecord = function(record, values) {
    _.extend(record, values);
  };
  Form.prototype.onSubmit = function(values) {
    var self = this;
    if (this.record) {
      this.updateRecord(this.record, values);
      this.emit("submit", [this.record]);
    } else {
      this.emit("submit", [values]);
    }
  };
  Form.prototype.onCancel = function() {
    this.emit("cancel", [this.record]);
  };
  Form.prototype.onInvalidForm = function(values, errors) {
    this.emit("invalid", [this.record, values, errors]);
  };
  ;
  var FormBuilder = function(config) {
    this.fields = config.fields.map(function(fieldDef) {
      return new Field(fieldDef);
    });
    this.buttons = this.createButtonConfig(config.buttons || {});
  };
  FormBuilder.prototype = {};
  FormBuilder.prototype.buildForm = function(formSelector, cb) {
    var self = this;
    var formDiv = $(formSelector);
    var formLoader;
    var formValidator;
    formDiv.addClass("form-all");
    async.parallel([function(done) {
      async.forEachSeries(self.fields, function(field, next) {
        self.addField(formDiv, field, next);
      }, function() {
        self.addButtons(formDiv);
        done();
      });
    }, function(done) {
      self.buildLoader(formDiv, function(loader) {
        formLoader = loader;
        done();
      });
    }, function(done) {
      self.buildValidator(formDiv, function(validator) {
        formValidator = validator;
        done();
      });
    }], function() {
      var form = new Form(formDiv, formLoader, formValidator);
      cb(null, form);
    });
  };
  FormBuilder.prototype.addField = function(form, field, cb) {
    if (field.isHiddenInput()) {
      return this.buildInput(field, function(err, formInput) {
        form.append(formInput);
        cb();
      });
    } else {
      return this.buildField(field, function(err, formField) {
        form.append(formField);
        cb();
      });
    }
  };
  FormBuilder.prototype.addButtons = function(form) {
    var buttons = this.buildButtons();
    form.append(buttons);
  };
  FormBuilder.prototype.buildField = function(field, cb) {
    var self = this;
    var formField = $("<div></div>");
    formField.addClass("form-line");
    self.buildInput(field, function(err, input) {
      var label = self.buildLabel(field);
      var subLabel = self.buildSubLabel(field);
      if (label)
        formField.append(label);
      formField.append(input);
      if (subLabel)
        formField.append(subLabel);
      cb(null, formField);
    });
  };
  FormBuilder.prototype.buildLabel = function(field) {
    if (!field.getLabel())
      return undefined;
    var label = $("<label></label>");
    label.addClass("form-label-left");
    label.attr("for", field.getId());
    label.text(field.getLabel());
    if (field.isRequired())
      label.append("<span class='form-required'>*</span>");
    return label;
  };
  FormBuilder.prototype.buildSubLabel = function(field) {
    if (!field.getSubLabel())
      return undefined;
    var subLabel = $("<label></label>");
    subLabel.addClass("form-sub-label");
    subLabel.attr("for", field.getId());
    subLabel.html(field.getSubLabel());
    return subLabel;
  };
  FormBuilder.prototype.buildInput = function(field, cb) {
    var input = $("<div></div>");
    var control;
    input.addClass("form-input");
    switch (field.getType()) {
      case "checkbox":
        input = $("<span></span>").appendTo(input);
        input.addClass("form-checkbox-item");
        control = $("<input type='checkbox' />");
        control.addClass("form-checkbox");
        control.attr("value", "true");
        break;
      case "date":
        control = $("<input type='date' />");
        control.addClass("form-textbox");
        break;
      case "datetime":
        control = $("<input type='text' />");
        control.addClass("form-textbox");
        control.attr("size", "25");
        break;
      case "display":
        control = $("<span></span>");
        break;
      case "file":
        control = $("<input type='file' />");
        control.addClass("form-textbox");
        control.attr("size", "20");
        break;
      case "hidden":
        control = $("<input type='hidden' />");
        break;
      case "number":
        control = $("<input type='number' />");
        control.addClass("form-textbox");
        control.attr("size", "5");
        control.attr("min", "0");
        break;
      case "select":
        control = $("<select></select>");
        control.addClass("form-dropdown");
        control.css("width", "150px");
        break;
      case "subForm":
        control = $("<a href='javascript: void(0);'>" + field.getLinkText() + "</a>");
        control.attr("linkText", field.getLinkText());
        control.subform(field);
        break;
      case "text":
        control = $("<input type='text' />");
        control.addClass("form-textbox");
        control.attr("size", "25");
        break;
      case "textarea":
        control = $("<textarea></textarea>");
        control.addClass("form-textarea");
        control.attr("cols", "30");
        control.attr("rows", "6");
        break;
      default:
        throw new Error("[Form Builder] buildInput() error - unexpected field type: " + field.getType());
    }
    control.attr("id", field.getId());
    input.append(control);
    if (field.getInputDesc())
      input.append("<br />" + field.getInputDesc());
    if (field.getType() == "select") {
      this.addSelectOptions(field, control, function() {
        cb(null, input);
      });
    } else {
      cb(null, input);
    }
  };
  FormBuilder.prototype.addSelectOptions = function(field, select, cb) {
    this.getSelectOptions(field, function(err, options) {
      if (field.isRequired() === false) {
        select.append("<option></option>");
      }
      options.forEach(function(option) {
        var value = option.value;
        var label = option.label;
        select.append("<option value='" + value + "'>" + label + "</option>");
      });
      cb();
    });
  };
  FormBuilder.prototype.getSelectOptions = function(field, cb) {
    if (field.getOptions()) {
      cb(null, field.getOptions());
    } else if (field.getOptionsUrl()) {
      $.get(field.getOptionsUrl(), function(data) {
        cb(null, data);
      });
    }
  };
  FormBuilder.prototype.buildButtons = function() {
    var self = this;
    var buttons = $("<div></div>");
    buttons.addClass("form-line");
    var label = $("<label></label>");
    label.addClass("form-label-left");
    buttons.append(label);
    if (this.buttons.submit.isVisible()) {
      var submitButton = $("<button type='submit'></button>");
      submitButton.attr("id", "submitButton");
      submitButton.addClass("form-submit-button");
      submitButton.text(this.buttons.submit.getLabel());
      buttons.append(submitButton);
    }
    if (this.buttons.cancel.isVisible()) {
      var cancelButton = $("<button type='submit'></button>");
      cancelButton.attr("id", "cancelButton");
      cancelButton.addClass("form-submit-button");
      cancelButton.text(this.buttons.cancel.getLabel());
      buttons.append(cancelButton);
    }
    return buttons;
  };
  FormBuilder.prototype.createButtonConfig = function(config) {
    return {
      submit: this.Button(_.defaults(config.submit || {}, {
        label: "Submit",
        visible: true
      })),
      cancel: this.Button(_.defaults(config.cancel || {}, {
        label: "Cancel",
        visible: true
      }))
    };
  };
  FormBuilder.prototype.Button = function(config) {
    return {
      isVisible: function() {
        return config.visible;
      },
      getLabel: function() {
        return config.label;
      }
    };
  };
  FormBuilder.prototype.buildLoader = function(formDivSelector, cb) {
    var formLoader = new FormLoader(this.fields, formDivSelector);
    cb(formLoader);
  };
  FormBuilder.prototype.buildValidator = function(formDivSelector, cb) {
    var formValidator = new FormValidator(this.fields, formDivSelector);
    cb(formValidator);
  };
  ;
  var FormLoader = function(fields, formDivSelector) {
    this.fields = fields;
    this.$form = $(formDivSelector);
  };
  FormLoader.prototype.loadForm = function(record) {
    var self = this;
    record = record || {};
    self.fields.forEach(function(field) {
      self.loadField(field, record);
    });
  };
  FormLoader.prototype.loadField = function(field, record) {
    var $form = this.$form;
    var fieldId = field.getId();
    var $field = $form.find("#" + fieldId);
    var value = ObjectDesc(record, fieldId);
    switch (field.getType()) {
      case "checkbox":
        field.attr("checked", (value == "true" || value === true) ? true : false);
        break;
      case "datetime":
        if (value)
          field.datetimepicker({value: moment(value).format("MM/DD/YYYY h:mm a")});
        break;
      case "select":
        if (!value) {
          field.val(null);
        } else {
          field.val(value);
        }
        break;
      case "subForm":
        field.subform('setValue', value);
        switch (field.valueType) {
          case "array.fk":
            if (value && value.length > 0)
              field.text(_.pluck(value, "name").join(", "));
            else
              field.text(field.attr("linkText"));
            break;
          case "fk":
            if (value)
              field.text(value.name);
            else
              field.text(field.attr("linkText"));
            break;
        }
        break;
      case "display":
        field.text(value || null);
        break;
      case "number":
        field.val(value || null);
        break;
      case "text":
        field.val(value || null);
        break;
      case "textarea":
        field.val(value || null);
        break;
      default:
        field.val(value || null);
        break;
    }
  };
  FormLoader.prototype.pullValues = function() {
    var self = this;
    var $form = self.$form;
    var values = {};
    self.fields.forEach(function(field) {
      var fieldId = field.getId();
      var $field = $form.find("#" + fieldId);
      self.setValue(field, $field, values);
    });
    return values;
  };
  FormLoader.prototype.setValue = function(field, $field, values) {
    var value;
    switch (field.getType()) {
      case "checkbox":
      case "radio":
        value = $field.prop("checked");
        break;
      case "datetime":
        value = new Date($field.val()).getTime();
        break;
      case "display":
        value = undefined;
        break;
      case "number":
        if (field.isIntegerField()) {
          value = parseInt($field.val().trim());
        } else if (field.isDecimalField()) {
          value = parseFloat($field.val().trim());
        }
        break;
      case "select":
        value = $field.val();
        break;
      case "subForm":
        value = $field.subform('getValue');
        if (value instanceof jQuery)
          value = undefined;
        break;
      case "text":
        value = $field.val().trim();
        break;
      case "textarea":
        value = $field.val().trim();
        break;
      default:
        value = $field.val();
        break;
    }
    if (value !== undefined)
      ObjectDesc(values, field.getId(), value);
  };
  ;
  var FormValidator = function(fields, formDivSelector) {
    this.fields = fields;
    this.formDiv = $(formDivSelector);
  };
  FormValidator.prototype.validate = function(values) {
    var self = this;
    var validationErrors = {};
    values = values || {};
    self.fields.forEach(function(field) {
      var fieldErrors = self.validateField(field, values);
      if (fieldErrors.length > 0)
        validationErrors[field.id] = fieldErrors;
    });
    return validationErrors;
  };
  FormValidator.prototype.validateField = function(fieldDef, values) {
    var value = values[fieldDef.id];
    var validations = this.getValidations(fieldDef);
    var errors = [];
    validations.forEach(function(validation) {
      if (validation.fn.call(null, value) === false) {
        errors.push(validation.msg);
      }
    });
    return errors;
  };
  FormValidator.prototype.getValidations = function(field) {
    var validations = [];
    if (field.isRequiredTextField()) {
      validations.push({
        fn: this.validateRequiredTextField,
        msg: field.getLabel() + " is required"
      });
    }
    if (field.isIntegerField()) {
      validations.push({
        fn: this.validateNumericField,
        msg: field.getLabel() + " must be a whole number"
      });
    }
    if (field.isDecimalField()) {
      validations.push({
        fn: this.validateNumericField,
        msg: field.getLabel() + " must be a number (with or without decimals)"
      });
    }
    return validations;
  };
  FormValidator.prototype.validateRequiredTextField = function(value) {
    return (value !== undefined) && (value.toString().length > 0);
  };
  FormValidator.prototype.validateNumericField = function(value) {
    return !isNaN(value);
  };
  return {
    get EventEmitter() {
      return EventEmitter;
    },
    get ObjectDesc() {
      return ObjectDesc;
    },
    get Form() {
      return Form;
    },
    get FormBuilder() {
      return FormBuilder;
    },
    get FormLoader() {
      return FormLoader;
    },
    get FormValidator() {
      return FormValidator;
    },
    __esModule: true
  };
});


