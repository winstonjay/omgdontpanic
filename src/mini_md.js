/*
TODO: integrare links and emphasis more fluidly.


*/
var miniMarkdown = (function() {

    // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    //  Tokens & other global constants.
    //
    //

    // first define the valid do
    const   EOL  = -1; // \n
            EOF  = 0,  // 0
            H1   = 1,  // #
            H2   = 2,  // ##
            H3   = 3,  // ###
            H4   = 4,  // ###
            LI   = 5,  // *
            TEXT = 6,  // any char
            LPAR = 7,  // (
            RPAR = 8,  // )
            LSQR = 9,  // [
            RSQR = 10; // ]

    // for error reporting and debugging.
    const tokens = [
        'EOL', 'EOF',
        'h1', 'h2', 'h3', 'h4',
        'li',
        'text',
        '(', ')', '[', ']'
    ];

    const inlineOperators = '\n[]()';

    // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    //  Scanner:
    //
    //  Scans the input text character by character splitting it up into tokens
    //  for the parser to parse. It has one external method `nextToken` which
    //  when called will emit the next token it builds from the text. The
    //  scanner dosen't return any errors or illegal token indicators instead
    //  any unrecognised tokens are read a generic TEXT tokens.
    //
    function Scanner(text) {

        var curr,
            level =  0,
            last  =  0,
            pos   = -1;

        // add a space \n as a quick workaround to not reaching the end
        // for some inline loops. Alternative is adding more checks to
        // most while loops or maybe changing to advance function to
        // something more robust.
        text += ' \n';

        // return the next found token per the rules of the scanner.
        this.nextToken = function() {
            while (advance()) {
                last  = pos
                level = 0;
                switch (curr) {
                case '\n':
                    return token(EOL, curr);
                case '[':
                    return token(LSQR, curr);
                case ']':
                    return token(RSQR, curr);
                case '(':
                    return token(LPAR, curr);
                case ')':
                    return token(RPAR, curr);
                case '*':
                    if (peekTokenIs(' ')) {
                        advance();
                        return token(LI, "*");
                    }
                case '#':
                    while (curr === '#' && level < 4) {
                        advance();
                        level++;
                    }
                    if (curr === ' ') {
                        return token(level, text.slice(last, pos));
                    }
                default:
                    // keep advancing until we find a inline operator. This
                    // could also be a newline. return the text up until this
                    // point and the next pass will emit the found token.
                    while (!peekTokenIn(inlineOperators)) {
                        advance();
                    }
                    return token(TEXT, text.slice(last, pos+1));
                }
            }
            return token(EOF, 0);
        }

        // move the scanner position +1 along the text.
        function advance() { return (curr = text.charAt(++pos)); }

        // return a new token with type and literal.
        function token(type, lit) { return {type: type, lit: lit}; }

        // boolean test on the peek char against the given expected char
        function peekTokenIs(expect) { return text.charAt(pos+1) === expect; }

        // boolean test on the peek char for inclusive in a given array.
        function peekTokenIn(expectedTokens) {
            return expectedTokens.includes(text.charAt(pos+1));
        }
    }

    // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    //  Parser.
    //
    //  The parser takes a `Scanner` as input and parses the tokens emited from
    //  the scanner's nextToken function into a valid abstract syntax tree. It
    //  has one external method, `parseDocument` which will return the whole
    //  syntax tree parsed.
    //
    function Parser(scanner) {

        // init the first token
        var tok = scanner.nextToken();

        this.parse = function() {
            try {
                return parseDocument();
            } catch(e) {
                return {
                    tag: 'div',
                    children: [newError(e)]
                };
            }
        }

        this.parseDocument = function() {
            let doc = {tag: 'div', children: []};
            while (tok.type !== EOF) {
                switch (tok.type) {
                case EOL:
                    expect(EOL);
                    break;
                case H1: case H2: case H3: case H4:
                    doc.children.push(parseHeader());
                    break;
                case LI:
                    doc.children.push(parseList());
                    break;
                default:
                    doc.children.push(parseParagraph());
                    break;
                }
            }
            return doc;
        }

        // header = # inline | ## inline | ### inline | #### inline
        function parseHeader() {
            let h = {tag: "h" + tok.type, children: []};
            expect(tok.type);
            h.children = parseInline();
            return h;
        }

        // paragraph = text | text \n paragraph
        function parseParagraph() {
            let p = {tag: "p", children: []};
            while (tok.type !== EOL && tok.type >= TEXT) {
                p.children.push(...parseInline());
                if (tok.type === EOL) {
                    expect(EOL);
                }
            }
            return p;
        }

        // list = * text | * text list
        function parseList() {
            let ul = {tag: "ul", children: []};
            while (tok.type === LI && tok.type !== EOF) {
                expect(LI);
                ul.children.push({tag: "li", children: parseInline()});
                expect(EOL);
            }
            return ul;
        }

        // text = inline | inline text | inline \n text
        // inline = .* | link
        function parseInline() {
            let items = [];
            while (tok.type !== EOL && tok.type !== EOF) {
                switch (tok.type) {
                case LSQR:
                    items.push(maybeLink());
                    break;
                default:
                    items.push({tag: "text", content: tok.lit});
                    expect(tok.type);
                }
            }
            return items;
        }

        // link = [text](text)
        function maybeLink() {
            // We dont know if it will be a link or normal text.
            let buf = [];
            let a = {tag: 'a'};
            try {
                buf.push(tok.lit); expect(LSQR);
                a.content = tok.lit;
                buf.push(tok.lit); expect(TEXT);
                buf.push(tok.lit); expect(RSQR);
                buf.push(tok.lit); expect(LPAR);
                a.href = tok.lit;
                buf.push(tok.lit); expect(TEXT);
                buf.push(tok.lit); expect(RPAR);
                return a;
            } catch(e) {
                expect(tok.type);
                return {tag: 'text', content: buf.join('')}
            }
        }

        function expect(type) {
            if (tok.type === type) {
                tok = scanner.nextToken();
                return;
            }
            throw ("Parse Error. (wrong token)" +
                   " expected=" + tokens[type] + " got=" + tokens[tok.type]);
        }

        function newError(e) {
            return {tag: 'label', content: e};
        }

    }

    // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    //  DOM Genneration
    //
    //
    function buildHTML(parent, node) {
        let x;
        if ('children' in node) {
            x = document.createElement(node.tag);
            for (let n of node.children) {
                parent.appendChild(x);
                buildHTML(x, n);
            }
        } else {
            if (node.tag === 'a') {
                x = document.createElement(node.tag);
                x.href = encodeURI(node.href);
                x.textContent = node.content;
            } else {
                x = document.createTextNode(node.content);
            }
            parent.appendChild(x);
        }
    }

    // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
    //  External interface.
    //
    //
    return {
        // expose the building blocks for debugging, testing and alt usage.
        Scanner:    Scanner,
        Parser:     Parser,
        buildHTML:  buildHTML,

        // main external caller.
        make: (function(target, source) {
            if (source === undefined || source === '') {
              return;
            }
            var scanner = new Scanner(source),
                parser  = new Parser(scanner),
                docAST  = parser.parseDocument();

            buildHTML(document.getElementById(target), docAST);
        })
    }
})();