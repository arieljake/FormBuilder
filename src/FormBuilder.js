export
var FormBuilder = function(config)
{
    this.fields = config.fields.map(function(fieldDef)
    {
        return new Field(fieldDef);
    });
    this.buttons = this.createButtonConfig(config.buttons || {});
};

FormBuilder.prototype = {};

FormBuilder.prototype.buildForm = function(formSelector, cb)
{
    var self = this;
    var formDiv = $(formSelector);
    var formLoader;
    var formValidator;

    formDiv.addClass("form-all");

    async.parallel(
        [

            function(done)
            {
                async.forEachSeries(

                    self.fields,

                    function(field, next)
                    {
                        self.addField(formDiv, field, next);
                    },

                    function()
                    {
                        self.addButtons(formDiv);

                        done();
                    }
                );
            },

            function(done)
            {
                self.buildLoader(formDiv, function(loader)
                {
                    formLoader = loader;
                    done();
                });
            },

            function(done)
            {
                self.buildValidator(formDiv, function(validator)
                {
                    formValidator = validator;
                    done();
                });
            }
        ],

        function()
        {
            var form = new Form(formDiv, formLoader, formValidator);
            cb(null, form);
        }
    );
};

FormBuilder.prototype.addField = function(form, field, cb)
{
    if (field.isHiddenInput())
    {
        return this.buildInput(field, function(err, formInput)
        {
            form.append(formInput);
            cb();
        });
    }
    else
    {
        return this.buildField(field, function(err, formField)
        {
            form.append(formField);
            cb();
        });
    }
};

FormBuilder.prototype.addButtons = function(form)
{
    var buttons = this.buildButtons();

    form.append(buttons);
};

FormBuilder.prototype.buildField = function(field, cb)
{
    var self = this;
    var formField = $("<div></div>");
    
    formField.addClass("form-line");

    self.buildInput(field, function(err, input)
    {
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

FormBuilder.prototype.buildLabel = function(field)
{
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

FormBuilder.prototype.buildSubLabel = function(field)
{
    if (!field.getSubLabel())
        return undefined;

    var subLabel = $("<label></label>");
    subLabel.addClass("form-sub-label");
    subLabel.attr("for", field.getId());
    subLabel.html(field.getSubLabel());

    return subLabel;
};

FormBuilder.prototype.buildInput = function(field, cb)
{
    var input = $("<div></div>");
    var control;

    input.addClass("form-input");

    switch (field.getType())
    {
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

    if (field.getType() == "select")
    {
        this.addSelectOptions(field, control, function()
        {
            cb(null, input);
        });
    }
    else
    {
        cb(null, input);
    }
};

FormBuilder.prototype.addSelectOptions = function(field, select, cb)
{
    this.getSelectOptions(field, function(err, options)
    {
        if (field.isRequired() === false)
        {
            select.append("<option></option>");
        }

        options.forEach(function(option)
        {
            var value = option.value;
            var label = option.label;

            select.append("<option value='" + value + "'>" + label + "</option>");
        });

        cb();
    });
};

FormBuilder.prototype.getSelectOptions = function(field, cb)
{
    if (field.getOptions())
    {
        cb(null, field.getOptions());
    }
    else if (field.getOptionsUrl())
    {
        $.get(field.getOptionsUrl(), function(data)
        {
            cb(null, data);
        });
    }
};

FormBuilder.prototype.buildButtons = function()
{
    var self = this;

    var buttons = $("<div></div>");
    buttons.addClass("form-line");

    var label = $("<label></label>");
    label.addClass("form-label-left");
    buttons.append(label);

    if (this.buttons.submit.isVisible())
    {
        var submitButton = $("<button type='submit'></button>");
        submitButton.attr("id", "submitButton");
        submitButton.addClass("form-submit-button");
        submitButton.text(this.buttons.submit.getLabel());
        buttons.append(submitButton);
    }

    if (this.buttons.cancel.isVisible())
    {
        var cancelButton = $("<button type='submit'></button>");
        cancelButton.attr("id", "cancelButton");
        cancelButton.addClass("form-submit-button");
        cancelButton.text(this.buttons.cancel.getLabel());
        buttons.append(cancelButton);
    }

    return buttons;
};

FormBuilder.prototype.createButtonConfig = function(config)
{
    return {
        submit: this.Button(_.defaults(config.submit || {},
        {
            label: "Submit",
            visible: true
        })),
        cancel: this.Button(_.defaults(config.cancel || {},
        {
            label: "Cancel",
            visible: true
        }))
    };
};

FormBuilder.prototype.Button = function(config)
{
    return {
        isVisible: function()
        {
            return config.visible;
        },
        getLabel: function()
        {
            return config.label;
        }
    };
};

FormBuilder.prototype.buildLoader = function(formDivSelector, cb)
{
    var formLoader = new FormLoader(this.fields, formDivSelector);

    cb(formLoader);
};

FormBuilder.prototype.buildValidator = function(formDivSelector, cb)
{
    var formValidator = new FormValidator(this.fields, formDivSelector);

    cb(formValidator);
};