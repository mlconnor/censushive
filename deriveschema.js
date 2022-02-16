const fs = require('fs')

// this generates hive schemas for each of the census tables listed here.
// didn't have much luck with a crawler because of issues like hyphens in
// the column names, column lengths being too long, and other nits

var tables = 'housing,economics,demographics,rural_urban,social'.split(',')
var databaseName = 'uscensus'

tables.forEach(doTable)

function doTable(table) {

var file = fs.readFileSync(table + '.tsv','utf8')
var lines = file.split("\n").filter((line)=> { return line.trim().length > 0 })
//console.log(lines[0])
var columnNames = lines[0].split("\t")
var columnTypes = columnNames.map(()=> { return 'STRING' })

//console.log(columnTypes)

for ( var i = 0; i < lines.length; i++ ) {
  var cols = lines[i].split("\t")
  var row = {}
  columnNames.forEach((name, i)=> {
   // console.log(`Reading ${name} index ${i}:`) 
    var colValue = cols[i].trim()
    if ( colValue.match(/^[+-]?[0-9]+\.[0-9]*$/) ) {
      // this is a DECIMAL
//      console.log('DECIMAL')
      columnTypes[i] = 'DOUBLE'
    } else if ( colValue.match(/^[0-9]+$/) ) {
      // int
      if ( columnTypes[i] != 'DECIMAL' ) {
        columnTypes[i] = 'INT'
      }
    } else if ( colValue == '' ) {
      // empty - do nothng
    } else {
      // still a string
    }
  })
}

columnTypes[0] = 'STRING'

var output = "-- this is the table definition for " + table + ".tsv\n\nCREATE EXTERNAL TABLE " + databaseName + "." + table + " (\n"
output += columnNames.map((name,index) => {
  return '  `' + name + '` ' + columnTypes[index]
}).join(",\n")

output += `
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\\t'
ESCAPED BY '\\\\'
LINES TERMINATED BY '\\n'
LOCATION
  's3://uscensusdata/${table}/'`;

console.log(output+"\n")

}
//console.log(columnNames.join("\n"))




