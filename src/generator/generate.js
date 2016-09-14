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

function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}// deleteFolderRecursive

// attempt to clear
try{
  deleteFolderRecursive("./dist");
}catch(e){
  console.log(e);
}
// set the content of the loaded schmea into the myData object
var schema = loadJSONfile(__dirname + filePath),
  // Include the Java lang generator
  langJava = require("./langs/java.js"),
    langJs = require("./langs/javascript.js"),
  //langD3 = require("./langs/d3.js"),
  namspace = "org.cmapi.primitives",

  // Add the target langs that will be used by generator
  langs = [langJava,langJs],
  i,
  len,
  langDef;

for (i = 0; i < langs.length; i++) {
  langDef = langs[i];

  langDef.generate(schema, namspace, debug);

};
