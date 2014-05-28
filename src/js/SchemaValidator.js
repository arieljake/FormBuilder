export
var SchemaValidator = function(schema)
{
    this.schema = schema;
};

SchemaValidator.prototype.validate = function(values)
{
    var self = this;

    values = values ||
    {};

    var result = tv4.validateMultiple(values, this.schema, true, true);

    if (result.valid)
        return [];

    var validationErrors = {};

    tv4.errors.forEach(function(error)
    {
        if (!validationErrors[error.dataPath])
            validationErrors[error.dataPath] = [];

        validationErrors[error.dataPath].push(error.message);
    });

    return validationErrors;
};