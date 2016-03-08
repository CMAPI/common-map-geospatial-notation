var fs = require('fs');
var debug = false;
var filePath = "/../schema/geonotation.schema.json";

if (process.argv[2] === "-debug") {
  debug = true;
}

if (process.argv[3] !== undefined && process.argv[3] !== null) {
  filePath = process.argv[3];
}
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
    if (debug) {
      console.log("An error occured while attempting to load the schema JSON file")
      console.log(err);
    }
  }
} // loadJSONfile


// set the content of the loaded schmea into the myData object
var schema = loadJSONfile(__dirname + filePath),
  // Include the Java lang generator
  langJava = require("./langs/java.js"),
  //langD3 = require("./langs/d3.js"),
  namspace = "org.cmapi.primitives",
  // Include the c# lang generator
  //langCSharp = require("./langs/cs.js"),
  // Add the target langs that will be used by generator
  langs = [langJava], //, langCSharp],
  i,
  len,
  langDef;

for (i = 0; i < langs.length; i++) {
  langDef = langs[i];

  langDef.generate(schema, namspace, debug);

};
