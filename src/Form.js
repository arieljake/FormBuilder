export var Form = function(formElement, loader, validator)
{
    this.formElement = formElement;
    this.loader = loader;
    this.validator = validator;

    this.attachToSubmitButton();
    this.attachToCancelButton();
};

Form.prototype = Object.create(EventEmitter.prototype);

Form.prototype.attachToSubmitButton = function()
{
    var self = this;

    this.formElement.find("#submitButton").bind("click", function(e)
    {
        var values = self.loader.pullValues();
        var errors = self.validator.validate(values);

        if (_.keys(errors).length > 0)
            self.onInvalidForm(values, errors);
        else
            self.onSubmit(values);
    });
};

Form.prototype.attachToCancelButton = function()
{
    var self = this;

    this.formElement.find("#cancelButton").bind("click", function(e)
    {
        self.onCancel();
    });
};

Form.prototype.getRecord = function()
{
    return this.record;
};

Form.prototype.loadRecord = function(record)
{
    this.record = record || {};
    this.loader.loadForm(this.record);
};

Form.prototype.updateRecord = function(record, values)
{
    _.extend(record, values);
};

Form.prototype.onSubmit = function(values)
{
    var self = this;

    if (this.record)
    {
        this.updateRecord(this.record,values);
        this.emit("submit", [this.record]);
    }
    else
    {
        this.emit("submit", [values]);
    }
};

Form.prototype.onCancel = function()
{
    this.emit("cancel", [this.record]);
};

Form.prototype.onInvalidForm = function(values, errors)
{
    this.emit("invalid", [this.record, values, errors]);
};