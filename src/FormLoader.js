// "moment"

export
var FormLoader = function(fields, formDivSelector)
{
    this.fields = fields;
    this.$form = $(formDivSelector);
};

FormLoader.prototype.loadForm = function(record)
{
    var self = this;

    record = record ||
    {};

    self.fields.forEach(function(field)
    {
        self.loadField(field, record);
    });
};

FormLoader.prototype.loadField = function(field, record)
{
    var $form = this.$form;
    var fieldId = field.getId();
    var $field = $form.find("#" + fieldId);
    var value = ObjectDesc(record, fieldId);

    switch (field.getType())
    {
        case "checkbox":
            field.attr("checked", (value == "true" || value === true) ? true : false);
            break;

        case "datetime":
            if (value)
                field.datetimepicker(
                {
                    value: moment(value).format("MM/DD/YYYY h:mm a")
                });
            break;

        case "select":
            if (!value)
            {
                field.val(null);
            }
            else
            {
                field.val(value); // in case we have id and not _id+name object
            }
            break;

        case "subForm":
            field.subform('setValue', value);

            switch (field.valueType)
            {
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

FormLoader.prototype.pullValues = function()
{
    var self = this;
    var $form = self.$form;
    var values = {};

    self.fields.forEach(function(field)
    {
        var fieldId = field.getId();
        var $field = $form.find("#" + fieldId);

        self.setValue(field, $field, values);
    });

    return values;
};

FormLoader.prototype.setValue = function(field, $field, values)
{
    var value;

    switch (field.getType())
    {
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
            if (field.isIntegerField())
            {
                value = parseInt($field.val().trim());
            }
            else if (field.isDecimalField())
            {
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