/**
 * @fileoverview stringify ast of jsx to js
 * @author javey
 * @date 15-4-22
 */

import * as Utils from './utils';

const {Type, TypeName} = Utils;

const attrMap = (function() {
    var map = {
        'class': 'className',
        'for': 'htmlFor'
    };
    return function(name) {
        return map[name] || name;
    };
})();
    
const normalizeArgs = function(args) {
    var l = args.length - 1;
    for (var i = l; i >= 0; i--) {
        if (args[i] !== 'null') {
            break;
        }
    }
    return (i === l ? args : args.slice(0, i + 1)).join(', '); 
};

const getLineAndColumn = function(code) {
    const lines = code.split(/\n/);

    return {
        line: lines.length,
        column: lines[lines.length - 1].length,
    };
};

export default function Stringifier() {}

Stringifier.prototype = {
    constructor: Stringifier,

    stringify: function(ast, autoReturn) {
        if (arguments.length === 1) {
            autoReturn = true;
        }
        this.autoReturn = !!autoReturn;
        this.enterStringExpression = false;
        this.head = ''; // save import syntax

        this.mappings = [];

        this.line = 1;
        this.column = 1;

        const ret = this._visitJSXExpressionContainer(ast, true);
        console.log(this.mappings, ret);
        return ret;
    },

    _addMapping(element) {
        this.mappings.push({
            generated: {
                line: this.line,
                column: this.column, 
            },
            original: {
                line: element.line,
                column: element.column,
            },
            element
        });
    },

    _visitJSXExpressionContainer: function(ast, isRoot) {
        var str = '',
            length = ast.length,
            hasDestructuring = false;

        let {line, column} = this;

        Utils.each(ast, function(element, i) {
            // if is root, add `return` keyword
            if (this.autoReturn && isRoot && i === length - 1) {
                str += 'return ';
                this.column = getLineAndColumn(str).column;
            }
            var tmp = this._visit(element, isRoot);
            this.line = 
            if (isRoot && element.type === Type.JSImport) {
                this.head += `${tmp}\n`;
            } else {
                str += tmp;
                const {line: l, column: c} = getLineAndColumn(str);
                this.line = line + l - 1;
                this.column += column + c;
            }
        }, this);

        if (!isRoot && !this.enterStringExpression) {
            // special for ... syntaxt
            if (str[0] === '.' && str[1] === '.' && str[2] === '.') {
                hasDestructuring = true;
                str = str.substr(3); 
            }
            str = 'function() {try {return (' + str + ')} catch(e) {_e(e)}}.call($this)';
            if (hasDestructuring) {
                str = '...' + str;
            }
            this.column += 
        }

        return str;
    },

    _visit: function(element, isRoot) {
        element = element || {};
        let ret;
        switch (element.type) {
            case Type.JS:
            case Type.JSImport:
                ret = this._visitJS(element);
                break;
            case Type.JSXElement:
                ret = this._visitJSXElement(element);
                break;
            case Type.JSXText:
                ret = this._visitJSXText(element);
                break;
            case Type.JSXUnescapeText:
                ret = this._visitJSXUnescapeText(element);
                break;
            case Type.JSXExpressionContainer:
                ret = this._visitJSXExpressionContainer(element.value);
                break;
            case Type.JSXWidget:
                ret = this._visitJSXWidget(element);
                break;
            case Type.JSXBlock:
                ret = this._visitJSXBlock(element, true);
                break;
            case Type.JSXVdt:
                ret = this._visitJSXVdt(element, isRoot);
                break;
            case Type.JSXComment:
                ret = this._visitJSXComment(element);
                break;
            case Type.JSXTemplate:
                ret = this._visitJSXTemplate(element);
                break;
            case Type.JSXString:
                ret = this._visitJSXString(element);
                break;
            default:
                ret = 'null';
                break;
        }

        return ret;
    },

    _visitJS: function(element) {
        const ret = this.enterStringExpression ? 
            '(' + element.value + ')' : 
            element.value; 

        this._addMapping(element);

        return ret;
    },

    _visitJSXElement: function(element) {
        if (element.value === 'template') {
            // <template> is a fake tag, we only need handle its children and itself directives
            return this._visitJSXDirective(element, this._visitJSXChildren(element.children));
        }

        var attributes = this._visitJSXAttribute(element, true, true);
        var ret = "h(" + normalizeArgs([
            "'" + element.value + "'", 
            attributes.props, 
            this._visitJSXChildren(element.children),
            attributes.className,
            attributes.key,
            attributes.ref
        ]) + ')';

        this._addMapping(element);

        return this._visitJSXDirective(element, ret);
    },

    _visitJSXChildren: function(children) {
        var ret = [];
        Utils.each(children, function(child) {
            // ignore element which handled by directive
            if (child.skip) return;
            ret.push(this._visit(child));
        }, this);

        return ret.length > 1 ? '[\n' + ret.join(',\n') + '\n]' : (ret[0] || 'null');
    },

    _visitJSXDirective: function(element, ret) {
        var directiveFor = {
            data: null,
            value: 'value',
            key: 'key'
        };
        Utils.each(element.directives, function(directive) {
            switch (directive.name) {
                case 'v-if':
                    ret = this._visitJSXDirectiveIf(directive, ret, element);
                    break;
                case 'v-for':
                    directiveFor.data = this._visitJSXAttributeValue(directive.value);
                    break;
                case 'v-for-value':
                    directiveFor.value = this._visitJSXText(directive.value, true);
                    break;
                case 'v-for-key':
                    directiveFor.key = this._visitJSXText(directive.value, true);
                    break;
                default:
                    break;
            }
        }, this);
        // if exists v-for
        if (directiveFor.data) {
            ret = this._visitJSXDirectiveFor(directiveFor, ret);
        }

        return ret;
    },

    _visitJSXDirectiveIf: function(directive, ret, element) {
        var result = this._visitJSXAttributeValue(directive.value) + ' ? ' + ret + ' : ',
            hasElse = false,
            next = element;

        while (next = next.next) {
            const nextDirectives = next.directives;

            if (!nextDirectives) break;

            if (nextDirectives['v-else-if']) {
                result += this._visitJSXAttributeValue(nextDirectives['v-else-if'].value) + ' ? ' + this._visit(next) + ' : ';
                continue;
            }
            if (nextDirectives['v-else']) {
                result += this._visit(next);
                hasElse = true;
            }

            break;
        }
        if (!hasElse) result += 'undefined';

        return result;
    },

    _visitJSXDirectiveFor: function(directive, ret) {
        return '__m(' + directive.data + ', function(' + directive.value + ', ' + directive.key + ') {\n' +
            'return ' + ret + ';\n' +
        '}, $this)';
    },

    _visitJSXString: function(element) {
        var ret = [];
        this.enterStringExpression = true;
        Utils.each(element.value, function(child) {
            ret.push(this._visit(child));
        }, this);
        this.enterStringExpression = false;
        return ret.join('+');
    },

    _visitJSXAttribute: function(element, individualClassName, individualKeyAndRef) {
        var ret = [],
            set = {},
            events = {},
            // support bind multiple callbacks for the same event
            addEvent = (name, value) => {
                const v = events[name];
                if (v) {
                    if (!Utils.isArray(v)) {
                        events[name] = [v];
                    }
                    events[name].push(value);
                } else {
                    events[name] = value;
                }
            },
            attributes = element.attributes,
            className,
            key,
            ref,
            type = 'text',
            models = [],
            addition = {trueValue: true, falseValue: false};
        Utils.each(attributes, function(attr) {
            if (attr.type === Type.JSXExpressionContainer) {
                return ret.push(this._visitJSXAttributeValue(attr, line));
            }
            var name = attrMap(attr.name),
                value = this._visitJSXAttributeValue(attr.value, line);
            if ((name === 'widget' || name === 'ref') && attr.value.type === Type.JSXText) {
                // for compatility v1.0
                // convert widget="a" to ref=(i) => widgets.a = i
                // convert ref="a" to ref=(i) => widgets.a = i. For Intact
                ref = 'function(i) {widgets[' + value + '] = i}';
                return;
            } else if (name === 'className') {
                // process className individually
                if (attr.value.type === Type.JSXExpressionContainer) {
                    // for class={ {active: true} }
                    value = '_className(' + value + ')';
                }
                if (individualClassName) {
                    className = value;
                    return;
                }
            } else if (name === 'key' && individualKeyAndRef) {
                key = value;
                return;
            } else if (name === 'ref' && individualKeyAndRef) {
                ref = value;
                return;
            } else if (Utils.isVModel(name)) {
                let [, model] = name.split(':');
                if (model === 'value') name = 'v-model';
                if (!model) model = 'value';
                models.push({name: model, value: value});
            } else if (name === 'v-model-true') {
                addition.trueValue = value;
                return;
            } else if (name === 'v-model-false') {
                addition.falseValue = value;
                return;
            } else if (name === 'type') {
                // save the type value for v-model of input element
                type = value;
            } else if (name === 'value') {
                addition.value = value;
            } else if (Utils.isEventProp(name)) {
                addEvent(name, value);
                return;
            }
            ret.push("'" + name + "': " + value);
            // for get property directly 
            set[name] = value;

        }, this);

        for (let i = 0; i < models.length; i++) {
            this._visitJSXAttributeModel(element, models[i], ret, type, addition, addEvent);
        }

        Utils.each(events, (value, name) => {
            ret.push(`'${name}': ${Utils.isArray(value) ? '[' + value.join(',') + ']' : value}`);
        });

        this.line += ret.length + 1;

        return {
            props: ret.length ? '{\n' + ret.join(',\n') + '\n}' : 'null',
            className: className || 'null',
            ref: ref || 'null',
            key: key || 'null',
            set: set
        };
    },

    _visitJSXAttributeModel: function(element, model, ret, type, addition, addEvent) {
        var valueName = model.name,
            value = model.value,
            eventName = 'change'; 

        if (element.type === Type.JSXElement) {
            switch (element.value) {
                case 'input':
                    switch (type) {
                        case "'file'":
                            eventName = 'change';
                            break;
                        case "'radio'":
                        case "'checkbox'":
                            var trueValue = addition.trueValue,
                                falseValue = addition.falseValue,
                                inputValue = addition.value;
                            if (Utils.isNullOrUndefined(inputValue)) {
                                ret.push(`checked: _getModel(self, ${value}) === ${trueValue}`);
                                addEvent('ev-change', `function(__e) {
                                    _setModel(self, ${value}, __e.target.checked ? ${trueValue} : ${falseValue}, $this);
                                }`);
                            } else {
                                if (type === "'radio'") {
                                    ret.push(`checked: _getModel(self, ${value}) === ${inputValue}`);
                                    addEvent('ev-change', `function(__e) { 
                                        _setModel(self, ${value}, __e.target.checked ? ${inputValue} : ${falseValue}, $this);
                                    }`);
                                } else {
                                    ret.push(`checked: _detectCheckboxChecked(self, ${value}, ${inputValue})`);
                                    addEvent('ev-change', `function(__e) { 
                                        _setCheckboxModel(self, ${value}, ${inputValue}, ${falseValue}, __e, $this);
                                    }`);
                                }
                            }
                            return;
                        default:
                            eventName = 'input';
                            break;
                    }
                    break;
                case 'select':
                    ret.push(`value: _getModel(self, ${value})`);
                    addEvent('ev-change', `function(__e) {
                        _setSelectModel(self, ${value}, __e, $this);
                    }`);
                    return;
                case 'textarea':
                    eventName = 'input';
                    break;
                default:
                    break;
            }
            addEvent(`ev-${eventName}`, `function(__e) { _setModel(self, ${value}, __e.target.value, $this) }`);
        } else if (element.type === Type.JSXWidget) {
            addEvent(`ev-$change:${valueName}`, `function(__c, __n) { _setModel(self, ${value}, __n, $this) }`);
        }
        ret.push(`${valueName}: _getModel(self, ${value})`);
    },

    _visitJSXAttributeValue: function(value, line) {
        return Utils.isArray(value) ? this._visitJSXChildren(value, line) : this._visit(value, false, line);
    },

    _visitJSXText: function(element, noQuotes) {
        var ret = element.value.replace(/([\'\"\\])/g, '\\$1').replace(/[\r\n]/g, '\\n');
        if (!noQuotes) {
            ret = "'" + ret + "'";
        }
        return ret;
    },

    _visitJSXUnescapeText: function(element) {
        return 'hu('+ this._visitJSXExpressionContainer(element.value) +')';
    },

    _visitJSXWidget: function(element) {
        const {blocks, children, hasBlock} = this._visitJSXBlocks(element, false);

        element.attributes.push({name: 'children', value: children});
        element.attributes.push({name: '_context', value: {
            type: Type.JS,
            value: '$this'
        }});
        if (hasBlock) {
            element.attributes.push({name: '_blocks', value: blocks});
        }

        var attributes = this._visitJSXAttribute(element, false, false);
        return this._visitJSXDirective(
            element, 
            'h(' + normalizeArgs([
                element.value, 
                attributes.props, 
                'null', 'null',
                attributes.key, 
                attributes.ref
            ]) + ')'
        );
    },

    _visitJSXBlock: function(element, isAncestor, line) {
        const {params, args} = this._visitJSXBlockAttribute(element);
        return this._visitJSXDirective(
            element,
            '(_blocks["' + element.value + '"] = function(parent' + (params ? ', ' + params : '') + ') {\n' +
            '    return ' + this._visitJSXChildren(element.children, line) + ';\n' + 
            '}) && (__blocks["' + element.value + '"] = function(parent) {\n' +
            '    var args = arguments;\n' +
            '    return blocks["' + element.value + '"] ? blocks["' + element.value + '"].apply($this, [function() {\n' +
            '        return _blocks["' + element.value + '"].apply($this, args);\n' +
            '    }].concat(__slice.call(args, 1))) : _blocks["' + element.value + '"].apply($this, args);\n' +
            '})' + (isAncestor ? ' && __blocks["' + element.value + '"].apply($this, ' + 
                (args ? '[__noop].concat(' + args + ')' : '[__noop]') + ')' : '')
        );
    },

    _visitJSXBlockAttribute: function(element) {
        const ret = {};

        Utils.each(element.attributes, function(attr) {
            const name = attr.name;
            let value;
            switch (name) {
                case 'args':
                    value = this._visitJSXAttributeValue(attr.value);
                    break;
                case 'params':
                    value = this._visitJSXText(attr.value, true);
                    break;
                default:
                    return;
            }
            ret[name] = value;
        }, this);
          
        return ret;
    },

    _visitJSXBlocks: function(element, isRoot) {
        const blocks = [];
        const children = [];

        Utils.each(element.children, function(child) {
            if (child.type === Type.JSXBlock) {
                blocks.push(this._visitJSXBlock(child, false));
            } else {
                children.push(child);
            }
        }, this);

        const _blocks = {
            type: Type.JS,
            value: blocks.length ? [
                'function(blocks) {',
                '    var _blocks = {}, __blocks = extend({}, blocks);',
                `    return (${blocks.join(' && ')}, __blocks);`,
                `}.call($this, ${isRoot ? 'blocks' : '{}'})`
            ].join('\n') : isRoot ? 'blocks' : 'null'
        };
    
        return {blocks: _blocks, children: children.length ? children : null, hasBlock: blocks.length};
    },

    _visitJSXVdt: function(element, isRoot) {
        const {blocks, children} = this._visitJSXBlocks(element, isRoot);
        element.attributes.push({name: 'children', value: children});
        const {props, set} = this._visitJSXAttribute(element, false, false);
        const ret = [
            '(function() {',
            '    var _obj = ' + props + ';',
            set.hasOwnProperty('arguments') ? 
            '    extend(_obj, _obj.arguments === true ? obj : _obj.arguments);\n' +
            '    delete _obj.arguments;' : '',
            '    return ' + element.value + '.call($this, _obj, _Vdt, ' + this._visitJS(blocks) + ', ' + element.value + ')',
            '}).call($this)'
        ].join('\n');

        return this._visitJSXDirective(element, ret);
    },

    _visitJSXComment: function(element) {
        return 'hc(' + this._visitJSXText(element) + ')';
    }
};
