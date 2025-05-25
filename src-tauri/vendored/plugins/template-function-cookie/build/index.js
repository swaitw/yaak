"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  plugin: () => plugin
});
module.exports = __toCommonJS(src_exports);
var plugin = {
  templateFunctions: [
    {
      name: "cookie.value",
      description: "Read the value of a cookie in the jar, by name",
      args: [
        {
          type: "text",
          name: "cookie_name",
          label: "Cookie Name"
        }
      ],
      async onRender(ctx, args) {
        console.log("COOKIE", args.values.cookie_name);
        const cookies = await ctx.cookies.listNames({});
        console.log("COOKIES", cookies);
        return ctx.cookies.getValue({ name: String(args.values.cookie_name) });
      }
    }
  ]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  plugin
});
