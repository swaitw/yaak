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
  templateFunctions: [{
    name: "regex.match",
    description: "Extract",
    args: [
      {
        type: "text",
        name: "regex",
        label: "Regular Expression",
        placeholder: "^w+=(?<value>w*)$",
        defaultValue: "^(.*)$",
        description: "A JavaScript regular expression, evaluated using the Node.js RegExp engine. Capture groups or named groups can be used to extract values."
      },
      { type: "text", name: "input", label: "Input Text", multiLine: true }
    ],
    async onRender(_ctx, args) {
      if (!args.values.regex) return "";
      const regex = new RegExp(String(args.values.regex));
      const match = args.values.input?.match(regex);
      return match?.groups ? Object.values(match.groups)[0] ?? "" : match?.[1] ?? match?.[0] ?? "";
    }
  }]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  plugin
});
