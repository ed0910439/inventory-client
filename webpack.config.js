const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // 入口文件
  entry: './src/index.js',

  // 输出设置
  output: {
    path: path.resolve(__dirname, 'build'), // 输出目录
    filename: 'bundle.js', // 输出文件名称
    publicPath: '/'       // 用于路由处理
  },

  // 模式
  mode: 'development', // 生产模式请改为 'production'

  // 模块加载器
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // 匹配.js, .jsx 文件
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // 使用 Babel 转义 ES6 和 JSX 语法
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/, // 匹配 .css 文件
        use: ['style-loader', 'css-loader'] // 使用两个加载器，解析 CSS 并嵌入到 JS 中
      },
      {
        test: /\.(png|jpg|gif)$/, // 处理图像文件
        use: [
          {
            loader: 'file-loader', // 文件加载器
            options: {
              outputPath: 'images'
            }
          }
        ]
      }
    ]
  },

  // 插件
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // 使用的模板文件
      filename: 'index.html'          // 输出的模板文件名
    })
  ],

  // 开发服务器
  devServer: {
    static: path.resolve(__dirname, 'public'), // 静态文件根目录
    historyApiFallback: true, // 支持 HTML5 History API
    port: 3000,               // 端口号
    open: true                // 自动打开浏览器
  },

  // 模块解析
  resolve: {
    extensions: ['.js', '.jsx'] // 自动解析这两种扩展名
  }
};
