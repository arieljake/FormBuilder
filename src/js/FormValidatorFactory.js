export
var FormValidatorFactory = {

    forFields: function(fields)
    {
        return new FieldValidator(fields);
    },

    forSchema: function(schema)
    {
        return new SchemaValidator(schema);
    }

};