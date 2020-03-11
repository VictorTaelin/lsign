/*                           o
               _____________/ \______________
              o                               o
       ______/ \______                 ______/ \______
      o               o               o               o
   __/ \__         __/ \__         __/ \__         __/ \__ 
  o       o       o       o       o       o       o       o
 / \     / \     / \     / \     / \     / \     / \     / \   
o   o   o   o   o   o   o   o   o   o   o   o   o   o   o   o
|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   | 
A   B   C   D   E   F   G   H   I   J   K   L   M   N   O   P */

var Hash = require("./hash.js");
var hash = (str) => Hash.keccak256s(str).slice(2);

module.exports = function(LEVELS) {
  // TODO: use crypto random instead *VERY IMPORTANT*
  function random() {
    var str = "";
    for (var i = 0; i < 64; ++i) {
      str += Math.floor(Math.random() * 16).toString(16);
    };
    return str;
  };

  // Flips the last bit
  function flip_last(bits) {
    var init = bits.slice(0, -1);
    var last = bits[bits.length - 1];
    return init + (last === "0" ? "1" : "0");
  };

  // Generates the signing tree of a private key
  var signing_trees = {};
  function signing_tree(private_key) {
    if (!signing_trees[private_key]) {
      var tree = {sigs: 0, seen: {}};
      function go(level, path) {
        if (level === 0) {
          tree[path+"e"] = hash(private_key + path);
          tree[path]     = hash(tree[path+"e"]);
          return tree[path];
        } else {
          var lft = go(level - 1, path+"0");
          var rgt = go(level - 1, path+"1");
          tree[path] = hash(lft + rgt);
          return tree[path];
        }
      };
      go(LEVELS, "");
      signing_trees[private_key] = tree;
    };
    return signing_trees[private_key];
  };

  // Returns the public address of a private key
  function public_key(private_key) {
    return signing_tree(private_key)[""];
  };

  // Gets the path of the nth value
  function path_of(nth) {
    var path = "";
    for (var i = 0; i < LEVELS; ++i) {
      path = String((nth >>> i) % 2) + path;
    };
    return path;
  };

  // Signs the nth bit, returns signature
  function sign(private_key, nth, bit) {
    var tree = signing_tree(private_key);
    if (nth > tree.sigs) {
      sign(private_key, nth - 1, bit);
    } else if (nth < tree.sigs) {
      throw "Already signed the `" + nth + " `th bit.";
    }
    var path = path_of((tree.sigs++)*2).slice(0,-1)+String(bit);
    var signature = [];
    signature.push(tree[path+"e"]);
    for (var node_path = path; node_path.length > 0; node_path = node_path.slice(0,-1)) {
      var side_path = flip_last(node_path);
      var side_hash = tree[side_path];
      if (!tree.seen[side_path]) {
        signature.push(side_hash);
      };
      tree.seen[node_path] = 1;
      tree.seen[side_path] = 1;
    };
    return signature;
  };

  // Checks if a public_key/signature pair is valid
  // TODO: infer public_key from signature
  var checking_trees = {};
  function check(public_key, signature) {
    for (var bit = 0; bit < 2; ++bit) {
      if (!checking_trees[public_key]) {
        checking_trees[public_key] = {sigs:0};
      };
      var tree = {...checking_trees[public_key]};
      var path = path_of((tree.sigs++)*2).slice(0,-1)+String(bit);
      tree[path+"e"] = signature[0];
      //console.log("......", signature);
      tree[path] = hash(tree[path+"e"]);
      var nodes = signature.slice(1).reverse();
      //console.log(nodes);
      var indx = 0;
      while (path.length > 0) {
        //console.log("-", path);
        var flp = flip_last(path);
        if (!tree[flp]) {
          tree[flp] = nodes.pop();
        };
        var ups = path.slice(0,-1);
        var lft = tree[ups + "0"];
        var rgt = tree[ups + "1"];
        tree[ups] = hash(lft + rgt);
        path = path.slice(0, -1);
      };
      var publ = tree[""];
      if (public_key === publ) {
        checking_trees[public_key] = tree;
        return bit;
      }
    }
    return null;
  };

  return {
    pvt: random,
    pub: public_key,
    sgn: sign,
    chk: check,
  };
};
