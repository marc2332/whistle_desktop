import { AppWindow } from "https://raw.githubusercontent.com/astrodon/astrodon/feature/deno_tauri/modules/astrodon/mod.ts";
import { Whistle, load } from "https://deno.land/x/whistle@v0.2.0/mod.ts";

const mainWindow = new AppWindow("Whistle + Astrodon");

mainWindow.setHtml(`
    <html>
        <head>
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    margin: 0;
                }
                body > div {
                    flex: 1;
                    border-bottom: 2px solid gray; 
                } 
                body > div > div {
                    padding: 5px;
                    height: calc(100% - 10px);
                    max-height: calc(100% - 10px);
                    background: rgb(240, 240, 240);
                    font-family: system-ui;
                    overflow: auto;
                } 
                button {
                    position: fixed;
                    border: 0;
                    padding: 12px 18px;
                    border-radius: 5px;
                    background: rgb(96, 165, 250);
                    color: white;
                }
                button:hover {
                    background: rgb(60, 130, 230);
                }
                #run {
                    top: 70px;
                    right: 20px;
                }
                #compile {
                    top: 20px;
                    right: 20px;
                }
            </style>
        </head>
        <body>
            <div><div id="input-ws" contentEditable  spellcheck="false">export fn add(a: i32, b: i32, c: i32): i32 { return a + b + c }</div></div>
            <div><div id="input-js" contentEditable  spellcheck="false">console.log(whistle.add(10,5,15))</div></div>
            <div><div id="output"></div></div>
            <button id="compile" onclick="compile()"> Compile </button>
            <button id="run" onclick="run()"> Run </button>
        </body>
        <script>
            async function compile(){
                console.log(1)
                const text = document.getElementById("input-ws").innerText;
                await window.sendToDeno("compile-whistle", { text });
            }
            async function run(){
                console.log(2)
                const text = document.getElementById("input-js").innerText;
                await window.sendToDeno("run-code", { text });
            }
            window.addEventListener("code-log", (ev) => {
                const output = ev.detail.values.join("\\n");
                document.getElementById("output").innerText = output;
            })
            window.addEventListener("code-error", (ev) => {
                const output = ev.detail.values.join("\\n");
                document.getElementById("output").innerText = output;
            })
        </script>
    </html>
`);

await mainWindow.run();

// deno-lint-ignore no-unused-vars
let whistle = {}

console.log = async (...values) =>
  await mainWindow.send("code-log", JSON.stringify({ values }));
console.error = async (...values) =>
  await mainWindow.send("code-error", JSON.stringify({ values }));

( async () => {
    for await (const msg of await mainWindow.listen("compile-whistle")) {
        const { text } = JSON.parse(msg);
        try {
          const bits =  await new Whistle(text).compile();
          whistle = await load(bits);
        } catch (e) {
          console.error(e.toString());
        }
      }
})()

for await (const msg of await mainWindow.listen("run-code")) {
    const { text } = JSON.parse(msg);
    try {
      eval(text)
    } catch (e) {
      console.error(e.toString());
    }
  }
