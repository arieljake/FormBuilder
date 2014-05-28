FormBuilder
===========

Convert JSON schema to forms complete with loaders, serializers, and validators

##The Basic Idea

The basic idea here is that a JSON schema contains enough information to generate a form, serializer, and validator for the record type it is written for.

Furthermore, it is a standard.

##Extensions

For those customizations to a form that we might want to make for which there are no corresponding fields in the JSON schema standard, there is an additional file structure available for defining those values.

##Sample Usage

```
var schemaStr = fs.readFileSync("mySchema.json","utf8");
var schema = JSON.parse(schemaStr);
var formBuilder = new FormBuilder(schema);

formBuilder.buildForm("#form1", function(err,form)
{
  form.on("submit", function(values)
  {
    console.dir(values);
  });
  
  form.on("cancel", function(values)
  {
    alert("Why give up?");
  });
  
  form.on("invalid", function(record, values, errors)
  {
    alert("We got issues...");
  });
});
```
