

define([], function()
{
	var FormRecord = function(config)
	{
		return {

			updateRecord: function(record,values,version,cb)
			{
				require(["/js/lib/formRecord/formRecord_v" + version + ".js"], function(mergeFunction)
				{
					mergeFunction.call(config,record,values,cb);
				});
			}

		};
	};

	return FormRecord;
});