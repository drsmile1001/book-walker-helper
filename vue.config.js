module.exports = {
  pages: {
    standalone: {
      template: "public/browser-extension.html",
      entry: "./src/standalone/main.ts",
      title: "Book Walker 助手",
      filename: "index.html",
    },
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: "src/background.ts",
        },
      },
    },
  },
};
