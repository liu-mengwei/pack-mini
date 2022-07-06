(function (graph) {
  function require(file) {
    function absRequire(relPath) {
      return require(graph[file].deps[relPath]);
    }

    var exports = {};
    (function (require, exports, code) {
      eval(code);
    })(absRequire, exports, graph[file].code);

    return exports;
  }

  require("./src/index.js");
})({
  "./src/index.js": {
    deps: { "./add.js": "./src/add.js", "./minus.js": "./src/minus.js" },
    code: '"use strict";\n\nvar _add = require("./add.js");\n\nvar _minus = require("./minus.js");\n\nvar sum = (0, _add.add)(1, 2);\nvar division = (0, _minus.minus)(1, 2);\nconsole.log(sum);\nconsole.log(division);',
  },
  "./src/add.js": {
    deps: {},
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.add = add;\n\nfunction add(a, b) {\n  return a + b;\n}',
  },
  "./src/minus.js": {
    deps: {},
    code: '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.minus = minus;\n\nfunction minus(a, b) {\n  return a - b;\n}',
  },
});
