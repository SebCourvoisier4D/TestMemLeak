# TestMemLeak
1. Clone the repository
2. Run `npm install`
3. Open the `./MemLeak Solution/MemLeak.waSolution` file with Wakanda Server
4. Wait for the 5Gb `.waData` file to be created (it could take many minutes!)
5. Run `node .` then enjoy...

The node.js script launches 6 JSON-RPC requests in parallel on Wakanda Server, in an endless loop.

Each JSON-RPC request runs an empty `forEach` loop on a DataClass (method `test` of the module `test`), that aims to completely fill the DB4D cache (since the DataClass contains about 5Gb of data). So one should be able to tell if DB4D really takes the cache settings into account and better isolate the leaks that could occur (IMHO) on the HTTP side, the SSJS side or the DB4D side (since there's nothing else in use).