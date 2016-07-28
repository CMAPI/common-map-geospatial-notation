# Common Map API Geo Primitives
### Overview
The geospatial primitives are a simple programming language independant set of interfaces representing geospatial features. These geo primitives are intented to simplify sharing of geospatial data between systems, and programming languages by defining the minimal set of geospatial attributes that should be avaiable to a map to properly render a geospatial representation, while allowing the underlying object implementing these interfaces to have other attributes and methods the map can ignore.

By defining a common data format that can be applied to multiple programming languages through code generation from a single source, applications can begin to define modules and applications that can interoperate with a wider array of map software with loose coupling.

The geo primitives are not designed to compete with geospatial data docuemnt formats like KML and GeoJSON.  These formats serve as a way to exchange gospatial data in a single, common format.  The CMAPI Geo primitives are designed to make the actual in code objects used be common and transferrable between languages.  When you use a document format like KML you must parse the KML into objects that the application environment understands - such as Java classes, or JavaScript objects.  The CMAPI Geo Primitves are designed to make loose coupling bettween implmentations in actual code possible without need of parsing text documents.

### Status

CMAPI Geo Primitives are currently in a beta in preperation for CMAPI 2.0 that will improve the concepts of CMAPI 1.x by
* Seperating data payload definitions from channels so that data definitions such as those provided in the CMAPI geo primitives can be reused properly without duplicate definitions across channels
* Provide broader programmining language agnostic approach that better facilitates use outside of web applications such as services, mobile apps, and desktop applications
* Provide code implmentations & utilities to make usage of CMAPI less abstract for application developers to use

## Usage

The CMAPI Geo Primitives are defined in a single JSON Schema file.  The base schema 
[geonotation.schema.json](https://raw.githubusercontent.com/CMAPI/common-map-geospatial-notation/master/src/schema/geonotation.schema.json) file is located in this github repo.

Currently Geo Primitive output can be generated in two lanuguges:
* Java
* JavaScript

#### Prerequisites

* You have `node` installed and are familiar with `npm`
* You have `git` installed and know how to clone a repo.

#### Installation:
1. clone the git repo from https://github.com/CMAPI/common-map-geospatial-notation.git
2. open command prompt at root of cloned repo

```sh
# grunt-cli is needed by grunt; you might have this installed already
npm install -g grunt-cli
npm install
```
At this point, you should now be able to generate the geo primitive interfaces

### Building 
We use a custom Node script to generate code in multiple languages.  currently Java and JavaScript are supported

1. Navigate to [Path to where you cloned repo]/src/generator and open command line interface

```sh
# Generate the code implmentations from schema
node generate.js
```
2. a 'dist' fiolder will be created with a folder containg the output for each language generated.  The dist folder is overwritten each time the generate script is executed, so don't make anychages to the output there

for the Java generator only .java files are created automatically.  You can compile them from command line by navigating to [Path to where you cloned repo]/src/generator/java/org/cmapi/primitives/ and open command line interface

```sh
# compile Java code and create jar file
javac *.java
jar cf org.cmapi.primitives.jar *.class 
```
Eventually this will all be automated and published to a well known repository such as Maven Central for releases
