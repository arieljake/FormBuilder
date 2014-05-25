export
var FormValidator = function(fields, formDivSelector)
{
    this.fields = fields;
    this.formDiv = $(formDivSelector);
};

FormValidator.prototype.validate = function(values)
{
    var self = this;
    var validationErrors = {};

    values = values ||
    {};

    self.fields.forEach(function(field)
    {
        var fieldErrors = self.validateField(field, values);

        if (fieldErrors.length > 0)
            validationErrors[field.id] = fieldErrors;
    });

    return validationErrors;
};

FormValidator.prototype.validateField = function(fieldDef, values)
{
    var value = values[fieldDef.id];
    var validations = this.getValidations(fieldDef);
    var errors = [];

    validations.forEach(function(validation)
    {
        if (validation.fn.call(null, value) === false)
        {
            errors.push(validation.msg);
        }
    });

    return errors;
};

FormValidator.prototype.getValidations = function(field)
{
    var validations = [];

    if (field.isRequiredTextField())
    {
        validations.push(
        {
            fn: this.validateRequiredTextField,
            msg: field.getLabel() + " is required"
        });
    }

    if (field.isIntegerField())
    {
        validations.push(
        {
            fn: this.validateNumericField,
            msg: field.getLabel() + " must be a whole number"
        });
    }

    if (field.isDecimalField())
    {
        validations.push(
        {
            fn: this.validateNumericField,
            msg: field.getLabel() + " must be a number (with or without decimals)"
        });
    }

    return validations;
};

FormValidator.prototype.validateRequiredTextField = function(value)
{
    return (value !== undefined) && (value.toString().length > 0);
};

FormValidator.prototype.validateNumericField = function(value)
{
    return !isNaN(value);
};