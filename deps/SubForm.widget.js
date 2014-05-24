

define(["/js/external/jquery/jquery.ui.widget.js"], function()
{
	$.widget("incom.subform",{

		_create: function ()
		{

		},

		_init: function()
		{
			var self = this;

			self.element.click(function()
			{
				require([self.options.href], function(subformFn)
				{
					self.options.form.children().fadeOut();

					var subformDiv = $("<div></div>").appendTo(self.options.form);
					var subform = subformFn(subformDiv, self._val, self.options);

					subform.on("valueUpdate", function(value)
					{
						self._val = value;

						if (value && self.options.valueType == "array.fk" && value.length > 0)
							self.element.text(_.pluck(value,"name").join(", "));
						else if (value && self.options.valueType == "fk")
							self.element.text(value.name);
						else
							self.element.text(self.element.attr("linkText"));
					});

					subform.on("close", function()
					{
						subformDiv.remove();
						self.options.form.children().fadeIn();
					});
				})
			})
		},

		_destroy: function () {},

		setValue: function(value)
		{
			this._val = value;
		},

		getValue: function()
		{
			return this._val;
		}

	})
})