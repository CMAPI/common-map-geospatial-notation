module.exports = {
  // Include so we can write files to disk.  fs is a native node js package
  fs: require('fs'),
  parseProperty: function(prop, schema, parentName) {
    var properties = [],
      uProp,
      type,
      propVal;

    if (schema.properties.hasOwnProperty(prop)) {
      propVal = schema.properties[prop];
      type = this.getType(propVal, prop, parentName);
      if (propVal.hasOwnProperty("enum")) {
        properties.push(this.createEnum(prop, propVal.enum));
      }
      // Make first character of property name uppercase for get / set camel casing
      uProp = prop.substring(0, 1).toUpperCase() + prop.substring(1, prop.length);
      properties.push('\n  /**');
      properties.push('  *' + propVal.description);
      properties.push('  */');
      properties.push('  @JsonProperty("' + prop + '")');
      properties.push("  public void set" + uProp + "(" + type + " value );\n");
      properties.push('  @JsonProperty("' + prop + '")');
      properties.push("  public " + type + " get" + uProp + "();\n");

    }
    return properties.join("\n");
  },
  getType: function(property, name, parentName) {
    // Default to string in case no type is avaiable
    var type = "string";
    if (property.hasOwnProperty("type")) {
      switch (property.type) {
        case "number":
          type = "float";
          break;
        case "string":
          type = "string";
          break;
        case "array":
          // This references a different interface so we need to get that interfaces name
          type = "List<" + property.items["$ref"].replace("#/definitions/", "") + ">";
          break;
        case "object":
          type = name;
          break;
      }
    } else if (property.hasOwnProperty("#ref")) {
      type = property["$ref"].replace("#/definitions/", "");

    } else if (property.hasOwnProperty("enum")) {
      type = parentName+"."+name;
    }
    return type;
  },
  createEnum: function(name, list) {
    var enums = [],
      len = list.length,
      i;
    enums.push("\n  public enum " + name + " {\n");
    for (i = 0; i < len; i++) {
      enums.push("    "+list[i]);
      if (i < len - 1) {
        enums.push(", ");
      }
      enums.push("\n");
    }
    enums.push("  }\n");
    return enums.join("");
  },

  createInterface: function(defs, name, schema) {
    var opt = [],
      refs = "",
      properties = [],
      prop,
      uProp,
      propVal,
      output,
      that = this,
      type,
      len,
      i;

    if (schema.hasOwnProperty("allOf")) {
      // Schema references one or more other schemas so we need to create the implments section
      refs = "";
      schema.allOf.forEach(function(item, index) {
        var type;
        if (item.hasOwnProperty("$ref")) {
          if (refs.length === 0) {
            refs = " implements ";
          } else {
            refs += ", ";
          }
          refs += item["$ref"].replace("#/definitions/", "");
        } else {
          if (item.hasOwnProperty("properties")) {
            for (prop in item.properties) {
              properties.push(that.parseProperty(prop, item, name));
            }
          }
        }
      });
    } else {
      //Iterate over properties that are defined within this schema
      if (schema.hasOwnProperty("properties")) {
        for (prop in schema.properties) {
          properties.push(this.parseProperty(prop, schema, name));
        }
      }
    }
    opt.push("package org.cmapi.geonotation;\n");
    opt.push("public interface " + name + refs + " {");
    opt.push(properties.join("\n"));
    opt.push("}");
    output = opt.join("\n");
    this.writeFile(name, output, "java");
    console.log(output);
    return (output);
  },

  writeFile: function(name, content, lang) {
    var dir = 'dist';
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = 'dist/' + lang;
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = 'dist/' + lang + "/org";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = 'dist/' + lang + "/org/cmapi/";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
     dir = 'dist/' + lang + "/org/cmapi/geonotation";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    this.fs.writeFile(dir + ".java", content, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("The file " + name + "." + lang + " was saved!");
      }
    });
  }

};
