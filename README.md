# TestMemLeak

## Prerequisites: 

- git
- node.js
- Wakanda Server Enterprise (Release or Debug)

## Usage: 

1. Clone the repository
2. Run `npm install` within the cloned repository
3. Open the `./MemLeak Solution/MemLeak.waSolution` file with Wakanda Server
4. Wait for the 5Gb `.waData` file to be created (it could take many minutes!)
5. Run `node .` then enjoy...

The node.js script launches 5 JSON-RPC requests in parallel on Wakanda Server (by default), in an endless loop.

Each JSON-RPC request runs an empty `forEach` loop on a DataClass (method `test` of the module `test`), that aims to completely fill the DB4D cache (since the DataClass contains about 5Gb of data). So one should be able to tell if DB4D really takes the cache settings into account and better isolate the leaks that could occur (IMHO) on the HTTP side, the SSJS side or the DB4D side (since there's nothing else in use).

## Results (on Mac, using Instruments):

Instruments shows leaks related to `xbox::PersistentValue::New(v8::isolate*, v8::Handle<v8::Value> conts&)`

Full stack (it's the same most of the times):

      0 libsystem_malloc.dylib malloc_zone_malloc
      1 libsystem_malloc.dylib malloc
      2 libc++.1.dylib operator new(unsigned long)
      3 4DJavaScriptV8Debug xbox::PersistentValue::New(v8::Isolate*, v8::Handle<v8::Value> const&) /depot/XToolbox/Main/JavaScript/Sources/V4DContext.cpp:2457
      4 4DJavaScriptV8Debug xbox::VJSObject::VJSObject(v8::Isolate*, v8::Handle<v8::Object> const&) /depot/XToolbox/Main/JavaScript/Sources/VJSValue.cpp:1720
      5 4DJavaScriptV8Debug xbox::VJSObject::VJSObject(v8::Isolate*, v8::Handle<v8::Object> const&) /depot/XToolbox/Main/JavaScript/Sources/VJSValue.cpp:1727
      6 4DJavaScriptV8Debug xbox::VJSClassImpl::CreateInstanceFromPrivateData(xbox::VJSContext const&, void*, void*) /depot/XToolbox/Main/JavaScript/Sources/VJSClass.cpp:206
      7 DB4DDebug xbox::VJSClass<VJSEntitySelectionIterator, EntitySelectionIterator>::CreateInstance(xbox::VJSContext const&, EntitySelectionIterator*) /depot/Components/Main/DB4D/Projects/XCode/../../../../../XToolbox/Main/JavaScript/Sources/VJSClass.h:250
      8 DB4DDebug VJSEntitySelection::_Each(xbox::VJSParms_callStaticFunction&, EntityCollection*) /depot/Components/Main/DB4D/Sources/javascript_db4d.cpp:5777
      9 DB4DDebug void xbox::VJSClass<VJSEntitySelection, EntityCollection>::js_callStaticFunction<&(VJSEntitySelection::_Each(xbox::VJSParms_callStaticFunction&, EntityCollection*))>(v8::FunctionCallbackInfo<v8::Value> const&) /depot/Components/Main/DB4D/Projects/XCode/../../../../../XToolbox/Main/JavaScript/Sources/VJSClass.h:191
     10 4DJavaScriptV8Debug v8::internal::FunctionCallbackArguments::Call(void (*)(v8::FunctionCallbackInfo<v8::Value> const&)) /depot/V8/3.29/src/arguments.cc:33
     11 4DJavaScriptV8Debug v8::internal::Object* v8::internal::HandleApiCallHelper<false>(v8::internal::(anonymous namespace)::BuiltinArguments<(v8::internal::BuiltinExtraArguments)1>, v8::internal::Isolate*) /depot/V8/3.29/src/builtins.cc:1145
     12 4DJavaScriptV8Debug v8::internal::Builtin_Impl_HandleApiCall(v8::internal::(anonymous namespace)::BuiltinArguments<(v8::internal::BuiltinExtraArguments)1>, v8::internal::Isolate*) /depot/V8/3.29/src/builtins.cc:1162
     13 4DJavaScriptV8Debug v8::internal::Builtin_HandleApiCall(int, v8::internal::Object**, v8::internal::Isolate*) /depot/V8/3.29/src/builtins.cc:1161

##Notes:


- On Mac, memory reporting only works **with an Enterprise version of Wakanda Server!**

- On Linux, memory reporting for Wakanda Server **is not available** (can't figure out how to do it properly).