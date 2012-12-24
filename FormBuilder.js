

(function()
{

	var FormBuilder = window.FormBuilder = function ()
	{

	};

	// Multi-input

	FormBuilder.generateMultiInput = function(fieldDesc)
	{
		var output = '<div class="formRow" id="' + fieldDesc.id + '_group">' +
			'<label class="formCell" for="' + fieldDesc.id + '">' + fieldDesc.label + '</label>' +
			'<input type="hidden" name="' + fieldDesc.id + '_desc" value="' + fieldDesc.id + ":" + fieldDesc.fields + '\"/>' +
			'<input type="hidden" name="' + fieldDesc.id + '_count" value="0"/>' +
			'<a href="javascript:void(\'0\');" onclick="addMultiInput(event);"> Add ' + fieldDesc.label + '</a>' +
			'</div>';

		return output;
	};

	FormBuilder.getMultiInputValue = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		var fields = fieldDesc.fields.split(",");
		var values = [];

		for (var i=0; i < count; i++)
		{
			var value = {};

			for (var j=0; j < fields.length; j++)
			{
				var fieldName = fields[j].split("/")[0];
				var field = $("[name='" + fieldDesc.id + "_" + i + "_" + fieldName + "']");
				value[fieldName] = $(field).val().trim();
			}

			values.push(value);
		}

		return values;
	};

	FormBuilder.setMultiInputValue = function(fieldDesc,values)
	{
		FormBuilder.resetMultiInput(fieldDesc);

		var multiInput = $("#" + fieldDesc.id + "_group")[0];
		var count = values ? values.length : 0;

		for (var i=0; i < count; i++)
		{
			FormBuilder.addMultiInput(multiInput,values[i]);
		}
	};

	FormBuilder.resetMultiInput = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		counter.val(0);

		for (var i=0; i < count; i++)
		{
			var field = $("[name^='" + fieldDesc.id + "_" + i + "_]");
			field.remove();
		}
	};

	FormBuilder.addMultiInput = function(multiInput,values)
	{
		values = values || {};

		var desc = $("input:hidden[name$='_desc']",multiInput);
		var counter = $("input:hidden[name$='_count']",multiInput);

		var descParts = desc.val().split(":");
		var fieldId = descParts[0];
		var fieldPairs = descParts[1].split(",");
		var curInputIndex = parseInt(counter.val(),10);
		var output = "<br />";

		for (var i=0; i < fieldPairs.length; i++)
		{
			var fieldPair = fieldPairs[i].split("/");
			var fieldName = fieldPair[0];
			var fieldType = fieldPair[1];
			var inputName = fieldId + "_" + curInputIndex + "_" + fieldName;

			switch (fieldType)
			{
				case "text":
				case "email":
				case "url":
					output += '<input type="' + fieldType + '" placeholder="' + fieldName + '" name="' + inputName + '"';
					if (values[fieldName])
					{
						output += ' value="' + values[fieldName] + '"';
					}
					output += ' />';
					break;
			}
		}

		counter.val(curInputIndex+1);
		$(multiInput).append(output);
	};

	window.addMultiInput = function(e)
	{
		var dest = $(e.target).parent();

		FormBuilder.addMultiInput(dest);
	};

	// Key/Value

	FormBuilder.generateKeyValueInput = function(fieldDesc)
	{
		var output = '<div class="formRow" id="' + fieldDesc.id + '_group">' +
			'<label class="formCell" for="' + fieldDesc.id + '">' + fieldDesc.label + '</label>' +
			'<input type="hidden" name="' + fieldDesc.id + '_count" value="0"/>' +
			'<a href="javascript:void(\'0\');" onclick="addKeyValueInput(event);"> Add ' + fieldDesc.label + '</a>' +
			'</div>';

		return output;
	};

	FormBuilder.getKeyValue = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		var values = {};

		for (var i=0; i < count; i++)
		{
			var key = $("#" + fieldDesc.id + "_" + i + "_key").val().trim();
			var val = $("#" + fieldDesc.id + "_" + i + "_val").val().trim();

			values[key] = val;
		}

		return values;
	};

	FormBuilder.setKeyValue = function(fieldDesc,values)
	{
		FormBuilder.resetKeyValue(fieldDesc);

		var keyValue = $("#" + fieldDesc.id + "_group")[0];
		var keys = _.keys(values);

		for (var i=0; i < keys.length; i++)
		{
			FormBuilder.addKeyValueInput(keyValue,keys[i],values[keys[i]]);
		}
	};

	FormBuilder.resetKeyValue = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		counter.val(0);

		for (var i=0; i < count; i++)
		{
			var field = $("[name^='" + fieldDesc.id + "_" + i + "_]");
			field.remove();
		}
	};

	FormBuilder.addKeyValueInput = function(keyValueInput,key,val)
	{
		var counter = $("input:hidden[name$='_count']",keyValueInput);
		var fieldId = $("label",keyValueInput).attr('for');
		var curInputIndex = parseInt(counter.val(),10);
		var output = "<br />";

		output += '<input type="text" placeholder="key" id="' + fieldId + '_' + curInputIndex + '_key"';

		if (key)
		{
			output += ' value="' + key + '"';
		}

		output += ' />';
		output += '<input type="text" placeholder="value" id="' + fieldId + '_' + curInputIndex + '_val"';

		if (val)
		{
			output += ' value="' + val + '"';
		}

		output += ' />';

		counter.val(curInputIndex+1);

		$(keyValueInput).append(output);
	};

	window.addKeyValueInput = function(e)
	{
		var dest = $(e.target).parent();

		FormBuilder.addKeyValueInput(dest);
	};

	// Value Array

	FormBuilder.generateValueArrayInput = function(fieldDesc)
	{
		var output = '<div class="formRow" id="' + fieldDesc.id + '_group">' +
			'<label class="formCell" for="' + fieldDesc.id + '">' + fieldDesc.label + '</label>' +
			'<input type="hidden" name="' + fieldDesc.id + '_count" value="0"/>' +
			'<a href="javascript:void(\'0\');" onclick="addValueArrayInput(event);"> Add ' + fieldDesc.label + '</a>' +
			'</div>';

		return output;
	};

	FormBuilder.getArrayOfValues = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		var values = [];

		for (var i=0; i < count; i++)
		{
			var val = $("#" + fieldDesc.id + "_" + i + "_val").val();

			values.push(val);
		}

		return values;
	};

	FormBuilder.setArrayOfValues = function(fieldDesc,values)
	{
		FormBuilder.resetValueArray(fieldDesc);

		var arrayInput = $("#" + fieldDesc.id + "_group")[0];
		var count = values ? values.length : 0;

		for (var i=0; i < count; i++)
		{
			FormBuilder.addValueArrayInput(arrayInput,values[i]);
		}
	};

	FormBuilder.resetValueArray = function(fieldDesc)
	{
		var counter = $("input:hidden[name^='" + fieldDesc.id + "']").filter("[name$='_count']");
		var count = parseInt(counter.val(),10);
		counter.val(0);

		for (var i=0; i < count; i++)
		{
			var field = $("[name^='" + fieldDesc.id + "_" + i + "_]");
			field.remove();
		}
	};

	FormBuilder.addValueArrayInput = function(arrayInput,value)
	{
		var counter = $("input:hidden[name$='_count']",arrayInput);
		var fieldId = $("label",arrayInput).attr('for');
		var curInputIndex = parseInt(counter.val(),10);
		var output = "<br />";

		output += '<input type="text" placeholder="value" id="' + fieldId + '_' + curInputIndex + '_val"';

		if (value)
		{
			output += ' value="' + value + '"';
		}

		output += ' />';

		counter.val(curInputIndex+1);

		$(arrayInput).append(output);
	};

	window.addValueArrayInput = function(e)
	{
		var dest = $(e.target).parent();

		FormBuilder.addValueArrayInput(dest);
	};
})();