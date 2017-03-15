module.exports = {
    // Include so we can write files to disk.  fs is a native node js package
    fs: require('fs'),
    debug: false,
    namespace: "",
    usedEnumKeys: {},
    objectEnumDefs: [],
    makeFirstUpperCase: function(interfaceName) {
        return interfaceName.substring(0, 1).toUpperCase() + interfaceName.substring(1, interfaceName.length);
    },
    interfaceToClassName: function(interfaceName) {
        return interfaceName.substring(1, 2).toUpperCase() + interfaceName.substring(2, interfaceName.length);
    },
    parsePropertyClass: function(prop, schema, privates, name, propList) {
        var properties = [],
            uProp,
            type,
            propVal,
            desc,
            newPropName,
            cName = this.interfaceToClassName(name),
            index = 1;
        if (schema.properties.hasOwnProperty(prop)) {
            propVal = schema.properties[prop];
            type = this.getType(propVal, prop, name);

            if (propList.length > 0) {
                propList.push(";");
            }
        

            privates.push("    "+type + " " + prop + " = " + (propVal.hasOwnProperty("protoIndex") ? propVal.protoIndex : "PROTOINDEX_NOT_DEFINED") + ";");
if (propVal.hasOwnProperty("typeExtension") && propVal.typeExtension.type === "enum") {
        this.objectEnumDefs.push(this.createObjectEnum(propVal.typeExtension.name, propVal));
      }
            
  

        }
        return properties.join("\n")+"}\n\n;";
    },
    checkStringFormat: function(property) {
        var type = "string";
        if (property.hasOwnProperty("format")) {
            switch (property.format) {
                case "date-time":
                    type = "google.protobuf.Timestamp";
                    break;
            }
        }
        return type;
    },
    getNumberFormat: function(format){
    var type = "double";
    switch(format){
      case "int":
        type = "int64";
      break;
      case "short":
        type = "short";
      break;
    }
    return type;
  },
    getType: function(property, name, parentName) {
        // Default to string in case no type is available
        var type = "string";
        if (property.hasOwnProperty("langType") && property.langType.hasOwnProperty("proto")) {
            type = property.langType.proto;
        } else if (property.hasOwnProperty("type")) {
            switch (property.type) {
                case "number":
                    if(property.hasOwnProperty("format")){
                      type = this.getNumberFormat(property.format);
                    } else {
                      type = "double";
                    }
                    break;
                case "string":
                    type = "string";
                    //type = this.checkStringFormat(property);
                    break;
                case "array":
                    type = "repeated " + this.interfaceToClassName(property.items["$ref"].replace("#/definitions/", ""));
                    break;
                case "object":
                    type = name;
                    break;
                case "boolean":
                    type = "boolean";
                    break;
                case "void":
                    type = "void";
                    break;
            }
        } else if (property.hasOwnProperty("$ref")) {
            type = this.interfaceToClassName(property["$ref"].replace("#/definitions/", ""));
            //type = property["$ref"].replace("#/definitions/", this.namespace + ".");

        } else if (property.hasOwnProperty("enum")) {
            type = "string"; // name;// + "."; //parentName + "." + this.makeFirstUpperCase(name);
            //type = this.namespace + "." + parentName + "." + name;
        }
        return type;
    },
    checkSpecialCase: function(name){
        if(typeof name === "string"){
            switch(name){
                case "MIL_STD_2525B":
                 name = "2525b";
                 break;
                case "MIL_STD_2525C":
                 name = "2525c";
                 break;
                case "ROUTE":
                 name = "ROUTE----------";
                 break;
                 case "CYLINDER":
                 name = "CYLINDER-------";
                 break;
                 case "POLYGON":
                 name = "POLYGON--------";
                 break;
                 case "RADARC":
                 name = "RADARC---------";
                 break;
                 case "POLYARC":
                 name = "POLYARC--------";
                 break;
                 case "TRACK":
                 name = "TRACK----------";
                 break;
                 case "CURTAIN":
                 name = "CURTAIN--------";
                 break;
                 case "ORBIT":
                 name = "ORBIT----------";
                 break;
            }
        }
        return name;
    },
    makeFirstUpperCase: function(interfaceName) {
    return interfaceName.substring(0, 1).toUpperCase() + interfaceName.substring(1, interfaceName.length);
  },// Turn a JSON Schema object into an enum to be used by a HashMap to behave like a JSON associative array (object)
  createObjectEnum: function(name, list) {
   
    var enums = [],
      len = list.length,
      itemKey,
      itemValue,
      i = 0,
      response = "";
 if(!this.usedEnumKeys[name]){
    this.usedEnumKeys[name] = name;
    for (item in list.properties) {
      itemValue = list.properties[item];
      if (itemValue.hasOwnProperty("enumLabel")) {
        itemKey = itemValue.enumLabel;
      } else {
        itemKey = item;
      }
      enums.push("    " + itemKey + " = "+i+" [(modifier_value) =  \"" + item + "\"]");
      i++;

    }

    response = "enum "+this.makeFirstUpperCase(name)+" {\n"+enums.join(";\n")+";\n}\n";
}
return response;
  },
    createEnum: function(name, list, className) {
        var enums = [],
            enumValue,
            that = this,
            len = list.length,
            i,
      response = "";

    if(!this.usedEnumKeys[name]){
        this.usedEnumKeys[name] = name;
        for (i = 0; i < len; i++) {
            enumValue = list[i];//that.checkSpecialCase(list[i]);
            enums.push("    " + list[i] + " = "+i+" [(modifier_value) =  \"" + enumValue + "\"]");
        }

        response = "enum "+this.makeFirstUpperCase(name)+" {\n"+enums.join(";\n")+";\n}\n";
        
        }
return response;
    },
    // Used to recursivley walk back up the interface inheritance tree to make sure all contracts are filled out
    recurseInterfaces: function(api, item, properties, privates, name, propList) {
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
                    that.recurseInterfaces(api, item2, properties, privates, name, propList);

                } else {
                    if (item2.hasOwnProperty("properties")) {
                        for (prop in item2.properties) {
                            properties.push(that.parsePropertyClass(prop, item2, privates, name, propList));
                        }
                    }
                }
            });
        } else {
            //Iterate over properties that are defined within this schema
            if (schema.hasOwnProperty("properties")) {
                for (prop in schema.properties) {
                    properties.push(this.parsePropertyClass(prop, schema, privates, name, propList));
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
            i;
        cName = that.interfaceToClassName(name);

        
        if (schema.hasOwnProperty("allOf")) {
            // Schema references one or more other schemas so we need to create the implments section
            refs = "";
            schema.allOf.forEach(function(item, index) {
                var type;
                if (item.hasOwnProperty("$ref")) {
                    if (index === 0) {
                      //  refs = that.interfaceToClassName(item["$ref"].replace("#/definitions/", ""));
                      
                    } //else if (index === 1) {

                    // } else {
                    //   refs += ", ";
                    // }
                    //  var refName = item["$ref"].replace("#/definitions/", "");
                   // if (index === 0) {
                        // It is assumed that the first item listed in the Schema as a ref is what this class will extend
                        // Others will be added as implments the interface
                        // Most schema items only have a single ref for inhertinece, however a few have both
                        //refs += refName.substring(1, 1).toUpperCase() + refName.substring(1, refName.length);
                        // If we uncomment below line, all overide functions for the inerited super class will be added as overides
                        // This seems unessecary as they will have no unique functionality so the simple inherited getters/ etters are sufficient
                        // that.recurseInterfaces(api, item, properties, privates, name, propList);
                    //    that.recurseInterfaces(api, item, [], [], name, []);
                   // } else {
                        // The first item extends so we don't need to add the overrides
                        // Everything else is an implements and we have to fill out contract from interface
                        // refs += refName;
                        that.recurseInterfaces(api, item, properties, privates, name, propList);
                   // }
                } else if (item.hasOwnProperty("properties")) {
                    for (prop in item.properties) {
                        properties.push(that.parsePropertyClass(prop, item, privates, name, propList));
                    }
                }
            });
        } else {
            //Iterate over properties that are defined within this schema
            if (schema.hasOwnProperty("properties")) {
                for (prop in schema.properties) {
                    properties.push(this.parsePropertyClass(prop, schema, privates, name, propList));
                }
            }
        }


   
        opt.push("message "+cName + " {\n");

        opt.push(privates.join("\n"));




        output = opt.join("\n")+"\n}\n\n";

        //this.writeFile(cName, "var cmapi = cmapi || {};\n" + output, ".js");

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


                            enumStr += that.createEnum(prop, curProp.enum) + "\n";
      
                            enums.push(enumStr);
                        }
                    }
                }
            });
        } else if (schema.hasOwnProperty("properties")) {
            for (prop in schema.properties) {

                curProp = schema.properties[prop];
                if (curProp.hasOwnProperty("enum")) {
           
                    enumStr += this.createEnum(prop, curProp.enum) + "\n";
             
                    enums.push(enumStr);
                }
            }
        }
        if (enums.length > 0) {
            output = enums.join("\n\n");
        }
        return output;
    },
    
    
    writeFile: function(name, content, extension) {
        var dir = "dist",
            that = this;
        if (!this.fs.existsSync(dir)) {
            this.fs.mkdirSync(dir);
        }
        dir = "dist/proto";
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
            headers = ['syntax = "proto3";','package cmapi;'],
            extend = ['extend google.protobuf.EnumValueOptions { string modifier_value = 50000; }'],
            options = [
            'option java_package = "org.cmapi.primitives.proto";',
            'option java_outer_classname = "CmapiProto";'
            ],
            importStatements = ['import "google/protobuf/descriptor.proto"','import "google/protobuf/timestamp.proto"'],
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
        headers = headers.join("\n\n")+"\n\n";
        importStatements = importStatements.join(";\n")+";\n\n";
        extend = extend.join("\n")+"\n\n";
        options = options.join("\n")+"\n\n";
        this.objectEnumDefs = this.objectEnumDefs.join("\n\n");
        compositeEnums = compositeEnums.join("\n") + "\n";
        composite = headers + importStatements + extend + options + compositeEnums + this.objectEnumDefs + composite;
   
        this.writeFile("org.cmapi.primitives", composite, ".proto");
    }
};
