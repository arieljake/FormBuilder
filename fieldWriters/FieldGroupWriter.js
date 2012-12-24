

var FieldGroupWriter = module.exports = function ()
{

}

FieldGroupWriter.createField = function(fieldGroup)
{
	var output = '<div class="formRow" id="' + fieldGroup.name + '_group">' +
		'<label class="formCell" for="' + fieldGroup.name + '">' + fieldDesc.label + '</label>' +
		'<input type="hidden" name="' + fieldGroup.name + '_desc" value="' + fieldDesc.name + ":" + fieldDesc.fieldsAsStr() + '\"/>' +
		'<input type="hidden" name="' + fieldGroup.name + '_count" value="0"/>' +
		'<a href="javascript:void(\'0\');" onclick="addMultiInput(event);"> Add ' + fieldGroup.item + '</a>' +
		'</div>';

	return output;
};