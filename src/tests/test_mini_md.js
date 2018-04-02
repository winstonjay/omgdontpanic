// Basic test suite for mini_md.js
(function() {

  let assert = function(test, message) {
    if (!test) {
      let x = document.createElement('p');
      x.textContent = "Assertion failed: " + message;
      x.style.color = "red";
      document.getElementById('log').appendChild(x);
      throw "Tests failed";
    }
    console.assert(test, message);
  }

  let log = function(message) {
    let x = document.createElement('p');
    x.textContent = message;
    x.style.color = "green";
    document.getElementById('log').appendChild(x);
    console.log(message);
  }

  testText1 = `
## hello world

this is some paragraph text.
this is some more text that should be the same

### we can do lists too...
* number 1.
* number 2.
* [item 3 is a link.](#url)

## hello i am another title.`;

  (function testScanner() {
    let scanner = new miniMarkdown.Scanner(testText1);

    const EOL  = -1; // \n
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

      const tokens = [
        'EOL', 'EOF',
        'h1', 'h2', 'h3', 'h4',
        'li',
        'text',
        '(', ')', '[', ']',
      ];

      const expected = [
          { type: EOL, lit: '\n' },
          { type: H2, lit: '##' },
          { type: TEXT, lit: 'hello world' },
          { type: EOL, lit: '\n' },
          { type: EOL, lit: '\n' },
          { type: TEXT, lit: 'this is some paragraph text.' },
          { type: EOL, lit: '\n' },
          { type: TEXT, lit: 'this is some more text that should be the same'},
          { type: EOL, lit: '\n' },
          { type: EOL, lit: '\n' },
          { type: H3, lit: '###' },
          { type: TEXT, lit: 'we can do lists too...' },
          { type: EOL, lit: '\n' },
          { type: LI, lit: '*' },
          { type: TEXT, lit: 'number 1.'},
          { type: EOL, lit: '\n' },
          { type: LI, lit: '*' },
          { type: TEXT, lit: 'number 2.'},
          { type: EOL, lit: '\n' },
          { type: LI, lit: '*' },
          { type: LSQR, lit: '['},
          { type: TEXT, lit: 'item 3 is a link.'},
          { type: RSQR, lit: ']'},
          { type: LPAR, lit: '('},
          { type: TEXT, lit: '#url'},
          { type: RPAR, lit: ')'},
          { type: EOL, lit: '\n' },
          { type: EOL, lit: '\n' },
          { type: H2, lit: '##' },
          { type: TEXT, lit: 'hello i am another title. ' },
          { type: EOL, lit: '\n' },
          { type: EOF, lit: 0 }
      ];
    let passed = true;
    let i = 0;
    for (let tt of expected) {
        tok = scanner.nextToken();
        assert(tt.type === tok.type,
            "[" + i + "] wrong type. want=" +
            tokens[tt.type+1] + ", got=" + tokens[tok.type+1]);
        assert(tt.lit === tok.lit,
            "[" + i + "] wrong literal: want=" + tt.lit + ", got='" + tok.lit +"'");
        i++;
        if (tt.type !== tok.type || tt.lit !== tok.lit) {
          passed = false;
        }
    }
    if (passed) {
      log("All Scanner tests Passed!");
    }
  })();

  function parseTest(id, source, expected) {
    try {
      let scanner = new miniMarkdown.Scanner(source),
      parser  = new miniMarkdown.Parser(scanner),
      result  = parser.parseDocument();

      let res = result.children,
          tt  = expected.children;

      assert(tt.length === res.length,
        id + ": wrong number of items. want="+tt.length+" got="+res.length);
      for (let i = 0; i < tt.length; i++) {
        assert(tt[i].tag === res[i].tag,
          id + ": wrong tag. want=" + tt[i].tag + " got=" + res[i].tag);
      }
      let ttJSON  = JSON.stringify(tt, null, 2);
      let resJSON = JSON.stringify(res, null, 2);
      assert(ttJSON === resJSON,
        id + ": JSON string representation not equal" +
        " want=\n" + ttJSON + "\ngot=\n" + resJSON);
      return true;
    } catch(e) {
      console.log(e);
      return false;
    }
  }

  (function testParser() {

      let passed = true;

      let testText1 = '# h1\n## h2\n### h3\n#### h4\n##### paragraph';
      if (!parseTest('Parser t1', testText1, {
        tag: 'div', children: [
          {tag: 'h1', children: [{tag: "text", content: "h1"}]},
          {tag: 'h2', children: [{tag: "text", content: "h2"}]},
          {tag: 'h3', children: [{tag: "text", content: "h3"}]},
          {tag: 'h4', children: [{tag: "text", content: "h4"}]},
          {tag: 'p', children:  [{tag: "text", content: "##### paragraph "}]},
        ]
      })) passed = false;

      let testText2 = '* li 1 text\n* li 2 text\np1 text\np1 text\n\np2 text';
      if (!parseTest('Parser t2', testText2, {
        tag: 'div', children: [
          {tag: 'ul', children: [
            {tag: 'li', children: [{tag: "text", content: "li 1 text"}]},
            {tag: 'li', children: [{tag: "text", content: "li 2 text"}]},
          ]},
          {tag: 'p', children: [
            {tag: "text", content: "p1 text"},
            {tag: "text", content: "p1 text"}
          ]},
          {tag: 'p', children: [{tag: "text", content: "p2 text "}]},
        ]
      })) passed = false;

      let testText3 = '[link text](#someurl) [paragr[aph)text]()'
      if (!parseTest('Parser t3', testText3, {
        tag: 'div', children: [
          {tag: 'p', children: [
            {tag: 'a', content: "link text", href: '#someurl'},
            {tag: "text", content: " "},
            {tag: "text", content: "[paragr["},
            {tag: "text", content: "aph"},
            {tag: "text", content: ")"},
            {tag: "text", content: "text"},
            {tag: "text", content: "]"},
            {tag: "text", content: "("},
            {tag: "text", content: ")"},
            {tag: "text", content: " "},
          ]}
        ]
      })) passed = false;

      if (passed) {
        log("All Parser tests Passed!");
      }

      // TODO check more.
  })();
})();