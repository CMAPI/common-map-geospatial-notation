var fs = require('fs');
// Load the schema JSON file
function loadJSONfile(filename, encoding) {
  try {
    // default encoding is utf8
    if (typeof(encoding) == 'undefined') encoding = 'utf8';

    // read file synchroneously
    var contents = fs.readFileSync(filename, encoding);
    // parse contents as JSON
    return JSON.parse(contents);

  } catch (err) {
    // an error occurred
    console.log("An error occured while attempting to load the schema JSON file")
    console.log(err);
  }
} // loadJSONfile


// set the content of the loaded schmea into the myData object
var schema = loadJSONfile(__dirname + '/../schema/geonotation.schema.json'),
  // Include the Java lang generator
  langJava = require("./langs/java.js"),
  // Include the c# lang generator
  //langCSharp = require("./langs/cs.js"),
  // Add the target langs that will be used by generator
  langs = [langJava],//, langCSharp],
  i,
  len,
  langDef,
  definitions = schema.definitions;

for (i = 0; i < langs.length; i++) {
  langDef = langs[i];
  for (var key in definitions) {
    langDef.createInterface(definitions, key, definitions[key]);
  }
};
