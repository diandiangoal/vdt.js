//var Parser = require('../src/lib/parser');
//var Stringifier = require('../src/lib/stringifier');
var util = require('util');
//var Utils = require('../src/lib/utils');
//var Vdt = require('../src/index');
//
//var parser = new Parser();
//var stringifier = new Stringifier();

//var source;
//source = "<div class={{ className }} style={{{width: '100px'}}}></div>";
//console.log(JSON.stringify(parser.parse(source, {
//    delimiters: ['{{', '}}']
//})));

//var source = "<script type='text/javascript'>\n\
//    var a = 1;\n\
//    console.log(a);\n\
//    if (a < 2) {\n\
//        console.log('less than {{ a < 2 'a' : 'b' }}');\n\
//    }\n\
//</script>\n\
//";
//
//
//console.log(util.inspect(parser.parse(source), {showHidden: true, depth: null}));


//var source;
//source = "\n<ul \nclassName=\"list\">\n    {[list].map(function(item) {\n        return <li id={item}>{item}</li>\n    })}\n</ul>";
//source = 'var a = "a\\"\\b"; <div class={"a\\" b"} a="a\'b">{a}</div>'
// source = '<div>{{a}</div>';
//source = '<script>var a = "<div>{a}\\a</div>";</script>';
//source = "<ul class=\"todo-list\">\n    {<li class=\"aa\"><li>}\n</ul>";
//source = "<t:card>\n    <b:body>\n        <div>test</div>\n    </b:body>\n</t:card>";
//Utils.setDelimiters(['{{', '}}']);
//source = "<script>\n    var a;\n\n    function aa() {\n        var msg;\n        msg = '<form onsubmit=\"return setPassword();\"';\n        msg += '  style=\"margin-bottom: 0px\">';\n        msg += '<input type=password size=10 id=\"password_input\">';\n        msg += '<\/form>';\n    }\n\n    if (a<1) { console.log(a) }\n\n    var b = \"{{ a }}\";\n</script>";
// source = "<div>\n    <div v-if={test === 1}>1</div>\n   <div v-else-if={test === 2}>2</div>\n    <!--<div v-else>default</div>-->\n</div>";
//source = "<div><div v-if={test === 1}></div> <Div v-else></Div></div>";
//console.log(util.inspect(parser.parse(source), {showHidden: true, depth: null}))
//source = "<Page />"
//console.log(stringifier.stringify(parser.parse(source)));

// var vdt = Vdt('<option selected={test}></option>');
// console.log(vdt.renderString({test: 0}));

//var Vdt = require('../dist')
//var source = '<div>{= self.content }</div>';
//var vdt = Vdt(source);
//console.log(vdt.renderString({content: '<div>a</div>'}))

var Vdt = require('../dist');
// var source = '<div><t:a v-if={true} /> <t:b v-else /></div>';
// var source = '<div {...a} b="1"></div>';
// var ast = Vdt.parser.parse(source);
// console.log(util.inspect(ast, {showHidden: true, depth: null}));
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)));

// var source = '<div><b:test>aa</b:test></div>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), "\n-------------\n")
// source = '<Widget><b:test>aa</b:test></Widget>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), "\n-------------\n")
// source = '<Widget><b:test1>aa</b:test1><b:test2>bb</b:test2>sdsdf</Widget>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), "\n-------------\n")
// source = '<t:layout><b:test>aa</b:test></t:layout>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), "\n-------------\n")
// source = '<t:layout></t:layout>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), "\n-------------\n")

// var source = 'var a = {a: 1}; <a {...a}></a>';


// source = "<div>\n    <b:show v-if={show}>show</b:show>\n    <b:hide v-else>hide</b:hide>\n</div>";

// source = "// comment\nvar a = 1; // comment\n/* comment */\n/*\n * comment\n */\n//<div>\n<div className=\"div\">\n    {/* comment in element */}\n    {a}\n</div>";
// source = "import a from './a'\nimport {b} from \"./b\"; import \"c\"\n\n<div>{test}</div>";
// source = '<div v-model="a" v-model:b="test" v-model-true={1} v-model-false="2"></div>';
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)), Vdt.stringifier.head);
 
// console.log(Vdt.stringifier.stringify(Vdt.parser.parse(source)));

// source = "<div>\n    <div v-if={a}>1</div>\n    <div v-if={b === 1}>2</div>\n    <div v-else-if={b === 2}>3</div>\n    <div v-else>4</div>\n</div>";
source = "<div><b:name args={[value]}>{value.name}</b:name></div>";
var ast = Vdt.parser.parse(source, {skipWhitespace: true});
console.log(util.inspect(ast, {showHidden: true, depth: null}));

