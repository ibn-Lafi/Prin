import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import baseConfig from "../../eslint.config.js";

const eslintConfig = [...baseConfig, ...coreWebVitals, ...nextTypescript];

export default eslintConfig;
