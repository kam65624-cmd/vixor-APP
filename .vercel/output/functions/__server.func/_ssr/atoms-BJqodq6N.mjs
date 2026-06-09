import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function SectionTitle({ title, action }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold tracking-tight", children: title }),
    action
  ] });
}
export {
  SectionTitle as S
};
