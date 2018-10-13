const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const ROOT_PATH = path.resolve(__dirname, '../');
console.log('ROOT_PATH', ROOT_PATH)
module.exports = {
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin([path.resolve(__dirname, 'dist')]), // 清理数据
    new HtmlWebpackPlugin({ // 自动打包数据
      title: '测试',
      template: './src/index.html', // html文件模板
    }),
    new webpack.HotModuleReplacementPlugin(), // 热替换
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development') // 定义开发者模式
    }),
  ],
  output: {
    filename: '[name].[hash].bundle.js', // 输出文件名称
    path: path.resolve(__dirname, 'dist') // 输出文件路径
  },
  devServer: { // 开发模式下服务器配置
    contentBase: path.resolve(__dirname, 'dist'), // 编译后文件路径
    // hot: true, // 是否开启热替换
    host: 'localhost', // 主机
    port: 3000,
    inline : true, // 必须
    overlay: { // 页面显示警告和错误
      warnings: true,
      errors: true
    },
    stats: 'errors-only',
    // {
       // 未定义选项时，stats 选项的备用值(fallback value)（优先级高于 webpack 本地默认值）
      // all: undefined,
      // // 添加资源信息
      // assets: true,
      // // 对资源按指定的字段进行排序
      // // 你可以使用 `!field` 来反转排序。
      // assetsSort: "field",
      // // 添加构建日期和构建时间信息
      // builtAt: true,
      // // 添加缓存（但未构建）模块的信息
      // cached: true,
      // // 显示缓存的资源（将其设置为 `false` 则仅显示输出的文件）
      // cachedAssets: true,
      // // 添加 children 信息
      // children: true,
      // // 添加 chunk 信息（设置为 `false` 能允许较少的冗长输出）
      // chunks: true,
      // // 添加 namedChunkGroups 信息
      // chunkGroups: true,
      // // 将构建模块信息添加到 chunk 信息
      // chunkModules: true,
      // // 添加 chunk 和 chunk merge 来源的信息
      // chunkOrigins: true,
      // // 按指定的字段，对 chunk 进行排序
      // // 你可以使用 `!field` 来反转排序。默认是按照 `id` 排序。
      // chunksSort: "field",
      // // 用于缩短 request 的上下文目录
      // context: "../src/",
      // // `webpack --colors` 等同于
      // colors: false,
      // // 显示每个模块到入口起点的距离(distance)
      // depth: false,
      // // 通过对应的 bundle 显示入口起点
      // entrypoints: false,
      // // 添加 --env information
      // env: false,
      // // 添加错误信息
      // errors: true,
      // // 添加错误的详细信息（就像解析日志一样）
      // errorDetails: true,
      // // 将资源显示在 stats 中的情况排除
      // // 这可以通过 String, RegExp, 获取 assetName 的函数来实现
      // // 并返回一个布尔值或如下所述的数组。
      // excludeAssets: "filter" | /filter/ | (assetName) => true | false |
      //   ["filter"] | [/filter/] | [(assetName) => true|false],
      // // 将模块显示在 stats 中的情况排除
      // // 这可以通过 String, RegExp, 获取 moduleSource 的函数来实现
      // // 并返回一个布尔值或如下所述的数组。
      // excludeModules: "filter" | /filter/ | (moduleSource) => true | false |
      //   ["filter"] | [/filter/] | [(moduleSource) => true|false],
      // // 查看 excludeModules
      // exclude: "filter" | /filter/ | (moduleSource) => true | false |
      //       ["filter"] | [/filter/] | [(moduleSource) => true|false],
      // // 添加 compilation 的哈希值
      // hash: true,
      // // 设置要显示的模块的最大数量
      // maxModules: 15,
      // // 添加构建模块信息
      // modules: true,
      // // 按指定的字段，对模块进行排序
      // // 你可以使用 `!field` 来反转排序。默认是按照 `id` 排序。
      // modulesSort: "field",
      // // 显示警告/错误的依赖和来源（从 webpack 2.5.0 开始）
      // moduleTrace: true,
      // // 当文件大小超过 `performance.maxAssetSize` 时显示性能提示
      // performance: true,
      // // 显示模块的导出
      // providedExports: false,
      // // 添加 public path 的信息
      // publicPath: true,
      // // 添加模块被引入的原因
      // reasons: true,
      // // 添加模块的源码
      // source: true,
      // // 添加时间信息
      // timings: true,
      // // 显示哪个模块导出被用到
      // usedExports: false,
      // // 添加 webpack 版本信息
      // version: true,
      // // 添加警告
      // warnings: true,
      // // 过滤警告显示（从 webpack 2.4.0 开始），
      // // 可以是 String, Regexp, 一个获取 warning 的函数
      // // 并返回一个布尔值或上述组合的数组。第一个匹配到的为胜(First match wins.)。
      // warningsFilter: "filter" | /filter/ | ["filter", /filter/] | (warning) => true|false
    // }
  },
  resolve: {
    symlinks: false,
    extensions: ['.js', '.jsx', 'json'],
    alias: {
      'react-dragzoom': path.resolve(ROOT_PATH, 'src'),
    },
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/, //配置要处理的文件格式，一般使用正则表达式匹配
      use: ['babel-loader'], //使用的加载器名称
      exclude: /node_modules/,
    }, {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/, //配置要处理的文件格式，一般使用正则表达式匹配
      use: ['url-loader'], //使用的加载器名称
      exclude: /node_modules/
    }, {
      test: /\.less$/, //配置要处理的文件格式，一般使用正则表达式匹配
      use: ['style-loader', 'css-loader', 'less-loader'], //使用的加载器名称
      exclude: /node_modules/
    }, {
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader',
      ],
    }]
  }
};