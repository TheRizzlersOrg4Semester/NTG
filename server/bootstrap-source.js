const fs = require("fs");
const path = require("path");
const vm = require("vm");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createGateById(gates) {
  return Object.fromEntries(gates.map((gate) => [gate.id, gate]));
}

function loadBootstrapPayload() {
  const filePath = path.join(__dirname, "..", "src", "domain", "shipments", "mock-data.jsx");
  const source = fs.readFileSync(filePath, "utf8");
  const sandbox = {
    console,
    window: {},
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "mock-data.jsx" });

  const payload = sandbox.window?.NTG?.domain?.shipments?.data;
  if (!payload) {
    throw new Error("Unable to load bootstrap payload from src/domain/shipments/mock-data.jsx");
  }

  const cloned = deepClone(payload);
  cloned.GATE_BY_ID = createGateById(cloned.GATES);
  return cloned;
}

module.exports = {
  loadBootstrapPayload,
  deepClone,
  createGateById,
};
