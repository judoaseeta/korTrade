const HtmlWebPackPlugin = require('html-webpack-plugin')

module.exports = {
    output: {
        publicPath: 'http://localhost:3000/',
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.scss', '.css'],
    },

    devServer: {
        port: 3000,
        historyApiFallback: true,
    },

    module: {
        rules: [
            {
                test: /\.m?js/,
                type: 'javascript/auto',
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.(css|s[ac]ss)$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(ts|tsx|js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },

    devtool: false,

    plugins: [
        new HtmlWebPackPlugin({
            template: './src/index.html',
        }),
    ],
}
