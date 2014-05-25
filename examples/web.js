var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.send("<html><body><h1>FormBuilder Examples</h1><a href='/html/index.html'>Start Here</a></body></html>");
});

app.listen(3010);