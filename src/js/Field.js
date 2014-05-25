var Field = function(fieldDef)
{
    this.fieldDef = fieldDef;
};

Field.prototype.getId = function()
{
    return this.fieldDef.id;
};

Field.prototype.getType = function()
{
    return this.fieldDef.type;
};

Field.prototype.getLabel = function()
{
    return this.fieldDef.label || this.getId();
};

Field.prototype.getSubLabel = function()
{
    return this.fieldDef.subLabel;
};

Field.prototype.getNumericPrecision = function()
{
    return this.fieldDef.precision;
};

Field.prototype.getLinkText = function()
{
    return this.fieldDef.linkText;
};

Field.prototype.getInputDesc = function()
{
    return this.fieldDef.inputDesc;
};

Field.prototype.getOptions = function()
{
    return this.fieldDef.options;
};

Field.prototype.getOptionsUrl = function()
{
    return this.fieldDef.optionsUrl;
};

Field.prototype.isRequired = function()
{
    return this.fieldDef.required === true;
};


Field.prototype.isHiddenInput = function()
{
    return this.isOfType("hidden");
};

Field.prototype.isSubForm = function()
{
    return this.isOfType("subForm");
};

Field.prototype.isCheckedField = function()
{
    return this.isOfType("checkbox");
};

Field.prototype.isTextualField = function()
{
    return this.isOfType(["text", "textarea", "number"]);
};

Field.prototype.isNumericField = function()
{
    return this.isOfType("number");
};

Field.prototype.isRequiredTextField = function()
{
    return this.isRequired() && this.isTextualField();
};

Field.prototype.isIntegerField = function()
{
    var precision = this.getNumericPrecision();
    
    return this.isOfType("number") && (precision === undefined || precision === 0);
};

Field.prototype.isDecimalField = function()
{
    var precision = this.getNumericPrecision();
    
    return this.isOfType("number") && (precision !== undefined && precision > 0);
};

Field.prototype.isOfType = function(types)
{
    if (typeof types == "string")
        types = [types];
    
    return types.indexOf(this.getType()) >= 0;
};