export
var FormConfig = {};

FormConfig.fromSchema = function(schema)
{
    var formConfig = {
        fields: [],
        buttons:
        {}
    };

    FormConfig.addSchemaToConfig(formConfig, schema, []);

    return FormConfig.validateConfig(formConfig);
};

FormConfig.validateConfig = function(config)
{
    config.fields.forEach(function(field)
    {
        field.selector = field.id.replace(".", "_");
    });

    return config;
};

FormConfig.addSchemaToConfig = function(config, schema, path)
{
    if (schema.type == "object")
    {
        FormConfig.addObjectToConfig(config, schema, path);
    }
    else if (schema.type == "string")
    {
        FormConfig.addStringToConfig(config, schema, path);
    }
    else
    {
        throw new Error("unsupported schema type: " + schema.type);
    }
};

FormConfig.addObjectToConfig = function(config, schema, path)
{
    for (var key in schema.properties)
    {
        FormConfig.addSchemaToConfig(config, schema.properties[key], path.concat(key));
    }

    if (schema.required)
    {
        schema.required.forEach(function(requiredField)
        {
            var field = config.fields.filter(function(field)
            {
                return field.id == requiredField;
            })[0];
            
            field.required = true;
        });
    }
};

FormConfig.addStringToConfig = function(config, schema, path)
{
    var id = path[path.length - 1];

    var field = {};
    field.id = path.join(".");
    field.type = schema.maxLength && schema.maxLength > 100 ? "textarea" : "text";
    field.label = schema.title || (id[0].toUpperCase() + id.substr(1));

    config.fields.push(field);
};