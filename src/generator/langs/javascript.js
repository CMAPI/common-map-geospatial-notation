module.exports = {
    // Include so we can write files to disk.  fs is a native node js package
    fs: require('fs'),
    debug: false,
    namespace: "",
    getDefaultValue: function(schema, type) {
        var defaultValue = "";
        if (type) {

            switch (type.toLowerCase()) {
                case "string":
                    if (schema.hasOwnProperty("default")) {
                        defaultValue = " =  \"" + schema.default+"\"";
                    }  /*else {

                        defaultValue = " =  \"\"";
                    }*/
                    break;
                case "double":
                case "float":
                case "int":
                case "number":
                    if (schema.hasOwnProperty("default")) {
                        defaultValue = " =  " + schema.default;
                    }
                    break;
                case "boolean":
                    if (schema.hasOwnProperty("default")) {
                        defaultValue = " =  " + schema.default;
                    }
                    break;
                case "array":
                    if (schema.hasOwnProperty("default")) {
                        defaultValue = " =  " + schema.default;
                    } else {
                        defaultValue = " =  []";
                    }
                    break;
                default:
                    if (type.indexOf("java.util.List") != -1) {
                        defaultValue = " =  []";
                    } else if (type.indexOf("java.util.UUID") != -1) {
                        defaultValue = " =  " + type.replace("java.util.UUID", "cmapi.randomUUID()");
                    } else if (type.indexOf("java.") === -1 && type.indexOf(".") === -1 && type.indexOf("I") !== -1) {
                        defaultValue = " =  new " + this.interfaceToClassName(type) + "()";
                    } else if (schema.hasOwnProperty("enum") && schema.hasOwnProperty("default")) {
                        defaultValue = " =  cmapi.enums." + type + schema.default;
                    } else if (schema.hasOwnProperty("langType") && schema.langType.hasOwnProperty("js")) {
                        defaultValue = " =  " + schema.langType.js + "()";
                    }

                    break;
            }

        }
        return defaultValue;
    },
    makeFirstUpperCase: function(interfaceName) {
        return interfaceName.substring(0, 1).toUpperCase() + interfaceName.substring(1, interfaceName.length);
    },
    interfaceToClassName: function(interfaceName) {
        return "cmapi." + interfaceName; //.substring(1, 2).toUpperCase() + interfaceName.substring(2, interfaceName.length);
    },
    parsePropertyClass: function(prop, schema, privates, name, propList, docs) {
        var properties = [],
            uProp,
            type,
            propVal,
            desc,
            defaultVal,
            newPropName,
            cName = this.interfaceToClassName(name);
        if (schema.properties.hasOwnProperty(prop)) {
            propVal = schema.properties[prop];
            type = this.getType(propVal, prop, name);
            defaultVal = this.getDefaultValue(propVal, type);
            docs.push("* @property {" + type + "} " + prop + "  - " + (propVal.description ? propVal.description : ""));
            if (propList.length > 0) {
                propList.push(",\n");
            }
            propList.push("        " + prop + " : _" + prop);

            privates.push("  var _" + prop + this.getDefaultValue(propVal, type) + ";");

            privates.push("  Object.defineProperty(this,\"" + prop + "\",{\n");
            privates.push("    enumerable: true,");
            privates.push("    get: function() { return _" + prop + "; },\n");
            // For proerties marked in schemas as "readOnly" we will not add a setter
            if(!(propVal.hasOwnProperty("readOnly") && propVal.readOnly === true)){
                privates.push("    set: function(value) { _" + prop + " = value; }\n");
            }
            
            privates.push("  });\n");

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
            if (curLine.length < lineMax && i < words.length-1) {
              curLine += " " + words[i];
            } else if (curLine.length >= lineMax || i === words.length-1) {

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
        var type = "string";
        if (property.hasOwnProperty("format")) {
            switch (property.format) {
                case "date-time":
                    type = "Date";
                    break;
            }
        }
        return type;
    },
    getType: function(property, name, parentName) {
        // Default to string in case no type is available
        var type = "string";
        if (property.hasOwnProperty("langType") && property.langType.hasOwnProperty("js")) {
            type = property.langType.js;
        } else if (property.hasOwnProperty("type")) {
            switch (property.type) {
                case "number":
                    type = "number";
                    break;
                case "string":
                    type = "string";
                    //type = this.checkStringFormat(property);
                    break;
                case "array":
                    type = "cmapi." + property.items["$ref"].replace("#/definitions/", "") + "[]";
                    break;
                case "object":
                    type = "cmapi."+name;
                    break;
                case "boolean":
                    type = "boolean";
                    break;
                case "void":
                    type = "void";
                    break;
            }
        } else if (property.hasOwnProperty("$ref")) {
            type = "cmapi."+property["$ref"].replace("#/definitions/", "");
            //type = property["$ref"].replace("#/definitions/", this.namespace + ".");

        } else if (property.hasOwnProperty("enum")) {
            type = "string"; // name;// + "."; //parentName + "." + this.makeFirstUpperCase(name);
            //type = this.namespace + "." + parentName + "." + name;
        }
        return type;
    },
    createEnum: function(name, list, className) {
        var enums = [],
            len = list.length,
            i;
        for (i = 0; i < len; i++) {

            enums.push("    " + list[i] + " : \"" + list[i] + "\"");
        }
        return enums.join(",\n");
    },
    // Used to recursivley walk back up the interface inheritance tree to make sure all contracts are filled out
    recurseInterfaces: function(api, item, properties, privates, name, propList, docs) {
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
                    that.recurseInterfaces(api, item2, properties, privates, name, propList, docs);

                } else {
                    if (item2.hasOwnProperty("properties")) {
                        for (prop in item2.properties) {
                            properties.push(that.parsePropertyClass(prop, item2, privates, name, propList, docs));
                        }
                    }
                }
            });
        } else {
            //Iterate over properties that are defined within this schema
            if (schema.hasOwnProperty("properties")) {
                for (prop in schema.properties) {
                    properties.push(this.parsePropertyClass(prop, schema, privates, name, propList, docs));
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
            propList = [],
            docs = ["/**"],
            i;
        cName = that.interfaceToClassName(name);
        docs.push("* " + (schema.description ? schema.description : ""));
        docs.push("* @interface");
        
        if (schema.hasOwnProperty("allOf")) {
            // Schema references one or more other schemas so we need to create the implments section
            refs = "";
            schema.allOf.forEach(function(item, index) {
                var type;
                if (item.hasOwnProperty("$ref")) {
                    if (index === 0) {
                        refs = that.interfaceToClassName(item["$ref"].replace("#/definitions/", ""));
                        docs.push("* @augments " + refs);
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
                        // that.recurseInterfaces(api, item, properties, privates, name, propList);
                        that.recurseInterfaces(api, item, [], [], name, [], docs);
                    } else {
                        // The first item extends so we don't need to add the overrides
                        // Everything else is an implements and we have to fill out contract from interface
                        // refs += refName;
                        that.recurseInterfaces(api, item, properties, privates, name, propList, docs);
                    }
                } else if (item.hasOwnProperty("properties")) {
                    for (prop in item.properties) {
                        properties.push(that.parsePropertyClass(prop, item, privates, name, propList, docs));
                    }
                }
            });
        } else {
            //Iterate over properties that are defined within this schema
            if (schema.hasOwnProperty("properties")) {
                for (prop in schema.properties) {
                    properties.push(this.parsePropertyClass(prop, schema, privates, name, propList, docs));
                }
            }
        }
        //refs += " implements " + name + " ";
        if (schema.hasOwnProperty("methods")) {
            for (prop in schema.methods) {

                properties.push(this.parseMethod(prop, schema, cName));
            }
        }

        docs.push("* @param {object} args - An optional object containing any mixture of the properties that belong to {@link " + cName + "} or the parent classes it inherits properties from.  Any properties in the args object that are not known properties will be ignored ");
        docs.push("*/");
        opt.push(docs.join("\n"));
        opt.push(cName + " = function ( args ) {\n");
        opt.push('  "use strict";\n');
        if (refs != "") {
            opt.push("  cmapi.inherit(new " + refs + "(),this);\n");
            //opt.push(refs + ".call(this, " + name + "JSON);\n");
        }
        opt.push(privates.join("\n"));
        //opt.push(properties.join("\n"));
        opt.push(that.getPatchProps());
        opt.push("  if( args ){ \n  this.patchProps( args );\n  }\n");
        opt.push("};\n");



        output = opt.join("\n");

        this.writeFile(cName, "var cmapi = cmapi || {};\n" + output, ".js");

        return (output);
    },
    generateEnums: function(api, name, schema) {
        var enums = [],
            enumStr = "",
            curProp,
            item, index,
            that = this,
            output = "";

        if (schema.hasOwnProperty("allOf")) {
            // Schema references one or more other schemas so we need to create the implments section
            refs = "";
            schema.allOf.forEach(function(item, index) {
                if (item.hasOwnProperty("properties")) {
                    for (prop in item.properties) {
                        curProp = item.properties[prop];
                        if (curProp.hasOwnProperty("enum")) {

                            enumStr += "  " + prop + " : {\n";
                            enumStr += that.createEnum(prop, curProp.enum) + "\n";
                            enumStr += "  }";
                            enums.push(enumStr);
                        }
                    }
                }
            });
        } else if (schema.hasOwnProperty("properties")) {
            for (prop in schema.properties) {

                curProp = schema.properties[prop];
                if (curProp.hasOwnProperty("enum")) {
                    enumStr += "  " + prop + " : {\n";
                    enumStr += this.createEnum(prop, curProp.enum) + "\n";
                    enumStr += "  }";
                    enums.push(enumStr);
                }
            }
        }
        if (enums.length > 0) {
            output = "/**\n* @readonly\n* @enum {string}\n*/" + enums.join(",");
        }
        return output;
    },
    getPatchProps: function() {
        var func = [];
        func.push("\n  this.patchProps = function(update) {\n");
        func.push("    var prop,\n");
        func.push("      propVal;\n");
        func.push("    for (prop in update) {\n");
        func.push("         propVal = update[prop];\n");
        func.push("         if(propVal !== undefined && propVal !== 'undefined'){\n");
        func.push("           this[prop] = propVal;\n");
        func.push("         }\n");
        func.push("      }\n");
        func.push("  };\n");
        return func.join("");
    },
    getInherit: function() {
        var func = [];
        func.push("cmapi.inherit = function(source,target) {\n");
        func.push("  var prop;\n");
        func.push("  for (prop in source) {\n");
        func.push("    target[prop] = source[prop];\n");
        func.push("  }\n");
        func.push("};\n");
        return func.join("");
    },
    getRandomUUID: function() {
        var func = [];
        func.push("cmapi.randomUUID = function() {\n");
        func.push("  function s(n) {\n");
        func.push("    return h((Math.random() * (1 << (n << 2))) ^ Date.now()).slice(-n); }\n");
        func.push("  function h(n) {\n");
        func.push("    return (n | 0).toString(16); }\n");
        func.push("  return [\n");
        func.push("    s(4) + s(4), s(4),\n");
        func.push("    '4' + s(3), // UUID version 4 \n");
        func.push("    h(8 | (Math.random() * 4)) + s(3), // {8|9|A|B}xxx \n");
        func.push("    // s(4) + s(4) + s(4), \n");
        func.push("    Date.now().toString(16).slice(-10) + s(2) // Use timestamp to avoid collisions \n");
        func.push("  ].join('-');\n");
        func.push("};\n");
        return func.join("");
    },
    writeFile: function(name, content, extension) {
        var dir = "dist",
            that = this;
        if (!this.fs.existsSync(dir)) {
            this.fs.mkdirSync(dir);
        }
        dir = "dist/js";
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
            key,
            composite = "",
            compositeEnums = [],
            newEnum = "";
        if (namespace) {
            this.namespace = namespace;
        }
        if (debug === true) {
            this.debug = true;
        }

        for (key in definitions) {
            composite += this.createApiPOJO(definitions, key, definitions[key]);
            newEnum = this.generateEnums(definitions, key, definitions[key]);
            if (newEnum.length > 0) {
                compositeEnums.push(newEnum);
            }

        }
        compositeEnums = "/**\n* @namespace \n*/\n cmapi = cmapi || {};\n/**\n* @namespace \n*/\ncmapi.enums = {\n" + compositeEnums.join(",\n") + "\n };";
        composite = compositeEnums + composite;
        this.writeFile("cmapi.enums", compositeEnums, ".js");
        var uuidFunc = this.getRandomUUID();
        this.writeFile("org.cmapi.primitives", composite + this.getInherit() + uuidFunc, ".js");
    }
};
