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
var import_node_crypto = require("node:crypto");
var algorithms = ["md5", "sha1", "sha256", "sha512"];
var encodings = ["base64", "hex"];
var hashFunctions = algorithms.map((algorithm) => ({
  name: `hash.${algorithm}`,
  description: "Hash a value to its hexidecimal representation",
  args: [
    {
      type: "text",
      name: "input",
      label: "Input",
      placeholder: "input text",
      multiLine: true
    },
    {
      type: "select",
      name: "encoding",
      label: "Encoding",
      defaultValue: "base64",
      options: encodings.map((encoding) => ({
        label: capitalize(encoding),
        value: encoding
      }))
    }
  ],
  async onRender(_ctx, args) {
    const input = String(args.values.input);
    const encoding = String(args.values.encoding);
    return (0, import_node_crypto.createHash)(algorithm).update(input, "utf-8").digest(encoding);
  }
}));
var hmacFunctions = algorithms.map((algorithm) => ({
  name: `hmac.${algorithm}`,
  description: "Compute the HMAC of a value",
  args: [
    {
      type: "text",
      name: "input",
      label: "Input",
      placeholder: "input text",
      multiLine: true
    },
    {
      type: "text",
      name: "key",
      label: "Key",
      password: true
    },
    {
      type: "select",
      name: "encoding",
      label: "Encoding",
      defaultValue: "base64",
      options: encodings.map((encoding) => ({
        value: encoding,
        label: capitalize(encoding)
      }))
    }
  ],
  async onRender(_ctx, args) {
    const input = String(args.values.input);
    const key = String(args.values.key);
    const encoding = String(args.values.encoding);
    return (0, import_node_crypto.createHmac)(algorithm, key, {}).update(input).digest(encoding);
  }
}));
var plugin = {
  templateFunctions: [...hashFunctions, ...hmacFunctions]
};
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  plugin
});
