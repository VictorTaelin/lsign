var qsign = require(".")(16);

// Creates a private/public key pair
var pvt = qsign.pvt();
var pub = qsign.pub(pvt);
console.log("private_key = " + pvt);
console.log("public_key  = " + pub);

// Bits to sign
var bits = [1, 1, 1, 1, 0, 0, 0, 1];

// Creates signatures
var sgns = [];
for (var i = 0; i < bits.length; ++i) {
  sgns.push(qsign.sgn(pvt, i, bits[i]));
  console.log("Signature for bit "+i+" ("+bits[i]+"):"+sgns[i].join(""));
};

// Checks signatures
for (var i = 0; i < bits.length; ++i) {
  console.log("Checked nth signature: "+qsign.chk(pub, sgns[i]));
};

// Tests the average signature size
//var sum = 0;
//var tot = Math.pow(2,15);
//for (var i = 0; i < tot; ++i) {
  //var sgn = qsign.sgn(pvt, i, 0);
  //sum += sgn.join("").length * 4;
//};
//console.log(sum / tot);
//console.log(qsign);
