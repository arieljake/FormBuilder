export
var ObjectDesc = function(obj, name, value, doDelete)
{
    if (!obj || !name)
        return undefined;

    var objRef = obj;
    var nameParts = Utils.isArray(name) ? name : name.split(".");

    if (nameParts.length > 1)
    {
        while (nameParts.length > 1)
        {
            var curParent = objRef;
            var property = nameParts.shift();
            var index = parseInt(property);

            if (Utils.isArray(objRef) && !isNaN(index) && index.toString()
                .length == property.length)
            {
                if (index < 0)
                    property = objRef.length + index;
                else
                    property = index;
            }

            objRef = objRef[property];

            if (objRef === undefined)
            {
                if (value === undefined)
                {
                    return undefined;
                }
                else
                {
                    objRef = curParent[property] = {};
                }
            }
        }
    }

    var finalProperty = nameParts.shift();

    if (doDelete === true)
        delete objRef[finalProperty];
    else if (value !== undefined)
        objRef[finalProperty] = value;
    else
        return objRef[finalProperty];
};