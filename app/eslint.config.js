// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // 터치(PanResponder)에서 최신 값을 읽으려고 ref에 담아 두는 방식을 앱 전체에서 의도적으로 씀
    rules: { "react-hooks/refs": "off" },
  }
]);
