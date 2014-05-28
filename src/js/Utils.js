export
var Utils = {

    isArray: function(obj)
    {
        return Array.isArray(obj);
    },

    isObject: function(obj)
    {
        return obj === Object(obj);
    },

    has: function(obj, key)
    {
        return Object.prototype.hasOwnProperty.call(obj, key);
    },

    pluck: function(obj, key)
    {
        return Utils.map(obj, Utils.property(key));
    },

    map: function(obj, iterator, context)
    {
        var results = [];
        if (obj === null) return results;
        return obj.map(iterator, context);
    },

    property: function(key)
    {
        return function(obj)
        {
            return obj[key];
        };
    },

    keys: function(obj)
    {
        if (!Utils.isObject(obj)) return [];
        if (Object.keys) return Object.keys(obj);
        var keys = [];
        for (var key in obj)
            if (Utils.has(obj, key)) keys.push(key);
        return keys;
    },

    defaults: function(obj)
    {
        var sources = Array.prototype.slice.call(arguments, 1);

        sources.forEach(function(source)
        {
            if (source)
            {
                for (var prop in source)
                {
                    if (obj[prop] === undefined)
                        obj[prop] = source[prop];
                }
            }
        });

        return obj;
    },
    
    extend: function(obj)
    {
        var sources = Array.prototype.slice.call(arguments, 1);

        sources.forEach(function(source)
        {
            if (source)
            {
                for (var prop in source)
                {
                    obj[prop] = source[prop];
                }
            }
        });

        return obj;
    }

};