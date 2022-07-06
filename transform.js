const fs = require("fs");
const parser = require("@babel/parser");
const path = require("path");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

function getModuleInfo(file) {
  const body = fs.readFileSync(file, "utf-8");
  const ast = parser.parse(body, { sourceType: "unambiguous" });

  const deps = {};
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(file);
      const abspath = "./" + path.join(dirname, node.source.value);
      deps[node.source.value] = abspath;
    },
  });

  const { code } = babel.transformFromAst(ast, null, {
    presets: [["@babel/preset-env"]],
  });

  fs.writeFileSync(path.join("./", path.basename(file)), code);
  return { file, deps, code };
}

function parseModules(file) {
  // 主模块
  const entry = getModuleInfo(file);
  const temps = [entry];
  const depsGraph = {};

  for (let i = 0; i < temps.length; i++) {
    const deps = temps[i].deps;
    for (const key in deps) {
      temps.push(getModuleInfo(deps[key]));
    }
  }

  temps.forEach(({ file, deps, code }) => {
    depsGraph[file] = {
      deps,
      code,
    };
  });

  console.log(depsGraph);
  return depsGraph;
}

parseModules("./src/index.js");

const bundle = (file) => {
  const depsGraph = JSON.stringify(parseModules(file));

  // 这里是个递归
  // 我们认为，每次调用一个require,都是通过这个路径名，在模块图中找到这个这段代码
  // 然后执行这段代码，因为代码是在匿名函数中，已经天然自带了require， exports对象，然后我所有的操作都是在 exports对象上进行挂载 (首先babel已经将所有的es标准转成了cjs标准)
  // 执行完成后，会返回exports对象，跳出这个递归，返回到上一级，然后在上层代码中就已经能够拿到这个导出的对象

  return `(function (graph) {
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
  
    require('${file}');
  })(${depsGraph});`;
};

const content = bundle("./src/index.js");

fs.mkdirSync("./dist");
fs.writeFileSync("./dist/bundle.js", content);

// 问题1， 依赖没有递归找到
// 问题2， 无法处理node_modules里的库
