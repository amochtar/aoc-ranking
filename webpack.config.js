const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const package = require("./package.json");

module.exports = {
    mode: "development",
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: "src/addon/icons", to: "icons" },
            {
                from: "src/addon/manifest.json",
                to: "manifest.json",
                transform(content, path) {
                    var manifest = JSON.parse(content.toString());
                    manifest.version = package.version;
                    manifestJson = JSON.stringify(manifest, null, 4);
                    return manifestJson;
                }
            },
            { from: "src/ranking.css" }
        ])
    ],
    entry: ["./src/ranking.js"],
    output: {
        filename: "ranking.js"
    }
};
