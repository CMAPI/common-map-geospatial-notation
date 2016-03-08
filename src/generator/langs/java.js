module.exports = {
  // Include so we can write files to disk.  fs is a native node js package
  fs: require('fs'),
  debug: false,
  namespace: "",
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
      uProp = this.makeFirstUpperCase(prop);
      properties.push('\n  /**');
      properties.push(this.getDocDescription(propVal.description));
      properties.push('   */');
      //properties.push('  @org.codehaus.jackson.annotate.JsonProperty("' + prop + '")');
      properties.push("    public void set" + uProp + "(" + type + " " + prop + ");\n");
      //properties.push('  @org.codehaus.jackson.annotate.JsonProperty("' + prop + '")');
      properties.push("    public " + type + " get" + uProp + "();\n");

    }
    return properties.join("\n");
  },
  getDefaultValue: function(schema, type) {
    var defaultValue = "";
    if (schema.hasOwnProperty("default")) {
      switch (type) {
        case "String":
          defaultValue = " = \"" + schema.default+"\"";
          break;
        case "Double":
          defaultValue = " = " + schema.default;
          break;
      }
    }
    return defaultValue;
  },
  makeFirstUpperCase: function(interfaceName) {
    return interfaceName.substring(0, 1).toUpperCase() + interfaceName.substring(1, interfaceName.length);
  },
  interfaceToClassName: function(interfaceName) {
    return interfaceName.substring(1, 2).toUpperCase() + interfaceName.substring(2, interfaceName.length);
  },
  parsePropertyClass: function(prop, schema, privates, name) {
    var properties = [],
      uProp,
      type,
      propVal,
      desc;

    if (schema.properties.hasOwnProperty(prop)) {
      propVal = schema.properties[prop];
      type = this.getType(propVal, prop, name);

      privates.push("    private " + type + " " + prop + this.getDefaultValue(propVal) + ";");
      // Make first character of property name uppercase for get / set camel casing
      uProp = this.makeFirstUpperCase(prop);
      properties.push('\n  /**');
      //properties.push(this.getDocDescription(propVal.description));
      properties.push(this.getDocParams(prop, propVal.description));
      properties.push('   */');
      //properties.push('  @org.codehaus.jackson.annotate.JsonProperty("' + prop + '")');
      properties.push("    public void set" + uProp + "(" + type + " " + prop + "){");
      properties.push("      this." + prop + " = " + prop + ";");
      properties.push("    }\n");
      properties.push('\n  /**');
      //properties.push(this.getDocDescription(propVal.description));
      properties.push(this.getDocReturns(prop, propVal.description));
      properties.push('   */');
      //properties.push('  @org.codehaus.jackson.annotate.JsonProperty("' + prop + '")');
      properties.push("    public " + type + " get" + uProp + "(){");
      properties.push("      return this." + prop + ";");
      properties.push("    }\n");
    }
    return properties.join("\n");
  },
  parseMethod: function(prop, schema, parentName) {
    var properties = [],
      uProp,
      type,
      atype,
      propVal;

    if (schema.methods.hasOwnProperty(prop)) {
      propVal = schema.methods[prop];
      type = this.getType(propVal.returns, prop, parentName);
      atype = this.getType(propVal.accepts, prop, parentName);
      properties.push('\n  /**');
      properties.push(this.getDocDescription(propVal.description));
      if (propVal.accepts.hasOwnProperty("name")) {
        properties.push(this.getDocParams(propVal.accepts.name, propVal.accepts.description));
      }
      properties.push('   */');

      properties.push("  public " + type + " " + prop + "(" + (propVal.accepts.hasOwnProperty("name") ? atype + " " + propVal.accepts.name : "") + ")" + this.getThrows(propVal) + ";\n");

    }
    return properties.join("\n");
  },
  getDocs: function(docs) {
    properties.push('\n  /**');
    properties.push('  *' + propVal.description);
    properties.push('  */');

  },
  getDocDescription: function(description) {
    var lineMax = 65,
      curLength = 0,
      desc = [],
      words,
      i,
      curLine = "";

    if (description) {

      words = description.split(" ")
      for (i = 0; i < words.length; i++) {
        if (curLine.length < lineMax) {
          curLine += " " + words[i];
        } else if (curLine.length > lineMax || i === words.length) {

          curLine += " " + words[i];
          desc.push("   * " + curLine);
          curLine = "";

        }

      }
    }

    return desc.join("\n");
  },
  getDocParams: function(param, description) {

    return "   * @param " + param + "        " + (description ? description : "");
  },
  getDocReturns: function(param, description) {

    return "   * @return " + param + "        " + (description ? description : "");
  },
  getThrows: function(propVal) {
    var expList = [],
      i,
      len;
    if (propVal.hasOwnProperty("throws")) {

      len = propVal.throws.length;

      for (i = 0; i < len; i++) {
        expList.push(propVal.throws[i]);
      }
    }
    return expList.join(", ");
  },
  /*
    JSON Schema v4 has a fromat property for string which allows for indicating a date format
  */
  checkStringFormat: function(property) {
    var type = "String";
    if (property.hasOwnProperty("format")) {
      switch (property.format) {
        case "date-time":
          type = "java.util.Date";
          break;
      }
    }
    return type;
  },
  getType: function(property, name, parentName) {
    // Default to string in case no type is available
    var type = "String";
    if (property.hasOwnProperty("type")) {
      switch (property.type) {
        case "number":
          type = "double";
          break;
        case "string":
          type = this.checkStringFormat(property);
          break;
        case "array":
          // This references a different interface so we need to get that interfaces name
          type = "java.util.List<" + property.items["$ref"].replace("#/definitions/", "") + ">";
          //type = "java.util.List<" + property.items["$ref"].replace("#/definitions/", this.namespace + ".") + ">";
          break;
        case "object":
          type = name;
          //type = this.namespace + "." + name;
          break;
        case "void":
          type = "void";
          break;
      }
    } else if (property.hasOwnProperty("$ref")) {
      type = property["$ref"].replace("#/definitions/", "");
      //type = property["$ref"].replace("#/definitions/", this.namespace + ".");

    } else if (property.hasOwnProperty("enum")) {
      type = parentName + "." + name;
      //type = this.namespace + "." + parentName + "." + name;
    }
    return type;
  },
  createEnum: function(name, list) {
    var enums = [],
      len = list.length,
      i;
    enums.push("\n  public enum " + name + " {\n");
    for (i = 0; i < len; i++) {
      enums.push("    " + list[i]);
      if (i < len - 1) {
        enums.push(", ");
      }
      enums.push("\n");
    }
    enums.push("  }\n");
    return enums.join("");
  },
  createApiInterface: function(api, name, schema) {
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
            refs = " extends ";
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

    if (schema.hasOwnProperty("methods")) {
      for (prop in schema.methods) {

        properties.push(this.parseMethod(prop, schema, name));
      }
    }

    opt.push("package " + this.namespace + ";\n");
    opt.push('\n  /**');
    opt.push(this.getDocDescription(schema.description));
    opt.push('   */');
    opt.push("public interface " + name + refs + " {");
    opt.push(properties.join("\n"));
    opt.push("}");
    output = opt.join("\n");
    this.writeFile(name, output, ".java");

    return (output);
  },
  // Used to recursivley walk back up the interface inheritance tree to make sure all contracts are filled out
  recurseInterfaces: function(api, item, properties, privates, name) {
    var that = this,
      curRef,
      schema,
      name,
      prop,
      propName;

    propName = item["$ref"].replace("#/definitions/", "");

    schema = api[propName];

    if (schema.hasOwnProperty("allOf")) {
      // Schema references one or more other schemas so we need to create the implments section
      schema.allOf.forEach(function(item2, index) {
        var type;
        if (item2.hasOwnProperty("$ref")) {
          that.recurseInterfaces(api, item2, properties, privates, name);

        } else {
          if (item2.hasOwnProperty("properties")) {
            for (prop in item2.properties) {
              properties.push(that.parsePropertyClass(prop, item2, privates, name));
            }
          }
        }
      });
    } else {
      //Iterate over properties that are defined within this schema
      if (schema.hasOwnProperty("properties")) {
        for (prop in schema.properties) {
          properties.push(this.parsePropertyClass(prop, schema, privates, name));
        }
      }
    }
  },
  // This creates the plain old Java object classes for every interface
  createApiPOJO: function(api, name, schema) {
    var opt = [],
      refs = "",
      properties = [],
      privates = [],
      prop,
      uProp,
      propVal,
      output,
      that = this,
      type,
      len,
      i;
    cName = that.interfaceToClassName(name);
    if (schema.hasOwnProperty("allOf")) {
      // Schema references one or more other schemas so we need to create the implments section
      refs = "";
      schema.allOf.forEach(function(item, index) {
        var type;
        if (item.hasOwnProperty("$ref")) {
          if (index === 0) {
            refs = " extends " + that.interfaceToClassName(item["$ref"].replace("#/definitions/", ""));
            refs += " implements " + name + " ";
          } //else if (index === 1) {
          
          // } else {
          //   refs += ", ";
          // }
          //  var refName = item["$ref"].replace("#/definitions/", "");
          if (index === 0) {
            // It is assumed that the first item listed in the Schema as a ref is what this class will extend
            // Others will be added as implments the interface
            // Most schema items only have a single ref for inhertinece, however a few have both
            //refs += refName.substring(1, 1).toUpperCase() + refName.substring(1, refName.length);
            // If we uncomment below line, all overide functions for the inerited super class will be added as overides
            // This seems unessecary as they will have no unique functionality so the simple inherited getters/ etters are sufficient
            //that.recurseInterfaces(api, item, properties, privates);
          } else {
            // The first item extends so we don't need to add the overrides
            // Everything else is an implements and we have to fill out contract from interface
            // refs += refName;
            that.recurseInterfaces(api, item, properties, privates, name);
          }
        } else if (item.hasOwnProperty("properties")) {
          for (prop in item.properties) {
            properties.push(that.parsePropertyClass(prop, item, privates, name));
          }
        }
      });
    } else {
      //Iterate over properties that are defined within this schema
      if (schema.hasOwnProperty("properties")) {
        for (prop in schema.properties) {
          properties.push(this.parsePropertyClass(prop, schema, privates, name));
        }
      }
    }

    if (schema.hasOwnProperty("methods")) {
      for (prop in schema.methods) {

        properties.push(this.parseMethod(prop, schema, cName));
      }
    }

    opt.push("package " + this.namespace + ";\n");
    opt.push('\n  /**');
    opt.push(this.getDocDescription(schema.description));
    opt.push('   */');
    opt.push("  public class " + cName + refs + " {\n");
    opt.push(privates.join("\n"));
    opt.push(properties.join("\n"));
    opt.push("  }");
    output = opt.join("\n");
    this.writeFile(cName, output, ".java");

    return (output);
  },
  writeFile: function(name, content, extension) {
    var dir = "dist",
      that = this;
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = "dist/java";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = "dist/java/org";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = "dist/java/org/cmapi/";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }
    dir = "dist/java/org/cmapi/primitives";
    if (!this.fs.existsSync(dir)) {
      this.fs.mkdirSync(dir);
    }

    this.fs.writeFile(dir + "/" + name + extension, content, function(err) {
      if (err) {
        that.log(err);
      } else {
        that.log("The file: " + dir + "/" + name + extension + " was saved!");
        // that.log(content);
      }
    });
  },
  log: function(message) {
    if (this.debug) {
      console.log(message);
    }
  },
  generate: function(schema, namespace, debug) {
    var definitions = schema.definitions,
      key;
    if (namespace) {
      this.namespace = namespace;
    }
    if (debug === true) {
      this.debug = true;
    }
    for (key in definitions) {
      this.createApiInterface(definitions, key, definitions[key]);
      this.createApiPOJO(definitions, key, definitions[key]);
    }
  }
};
