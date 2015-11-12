var qm = require('qminer')
var onlineAvr = require('../online-average.js')

//////// ONLINE AVERAGE  ////////
console.log("\n=== Online Average ===")

var average = new onlineAvr();

console.log("average.update(5):", average.update(5))
console.log("average.update(3):", average.update(3))

// testing saving model
var fout = new qm.fs.FOut('avr_test');
average.save(fout);

// testing loading function
var average2 = new onlineAvr();
var fin = new qm.fs.FIn('avr_test');
average2.load(fin);

// testing loading via constructor
var fin = new qm.fs.FIn('avr_test');
var average3 = new onlineAvr(fin);

console.log(JSON.stringify(average, false, 2));
console.log(JSON.stringify(average2, false, 2));
console.log(JSON.stringify(average3, false, 2));

debugger