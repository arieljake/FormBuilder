export
var FieldValidator = function(fields)
{
    this.fields = fields;
};

FieldValidator.prototype.validate = function(values)
{
    var self = this;
    var validationErrors = {};

    values = values ||
    {};

    self.fields.forEach(function(field)
    {
        var fieldErrors = self.validateField(field, values);

        if (fieldErrors.length > 0)
            validationErrors[field.getId()] = fieldErrors;
    });

    return validationErrors;
};

FieldValidator.prototype.validateField = function(field, values)
{
    var value = ObjectDesc(values,field.getId());
    var validations = this.getValidations(field);
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

FieldValidator.prototype.getValidations = function(field)
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

FieldValidator.prototype.validateRequiredTextField = function(value)
{
    return (value !== undefined) && (value.toString().length > 0);
};

FieldValidator.prototype.validateNumericField = function(value)
{
    return !isNaN(value);
};