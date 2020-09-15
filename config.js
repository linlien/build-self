const config = {
  // 开发环境
  dev: {
    host: "",
    username: "root",
    password: "",
    catalog: "", // 前端文件压缩目录
    port: 22, // 服务器ssh连接端口号
    privateKey: null // 私钥，私钥与密码二选一
  },
  // 测试环境
  test: {
    host: "", // 服务器ip地址或域名
    username: "root", // ssh登录用户
    password: "", // 密码
    catalog: "", // 前端文件压缩目录
    port: 22, // 服务器ssh连接端口号
    privateKey: null // 私钥，私钥与密码二选一
  },
  // 线上环境
  pro: {
    host: "", // 服务器ip地址或域名
    username: "root", // ssh登录用户
    password: "", // 密码，请勿将此密码上传至git服务器
    catalog: "", // 前端文件压缩目录
    port: 22, // 服务器ssh连接端口号
    privateKey: null // 私钥，私钥与密码二选一
  }
};

const args = process.argv.splice(2);
const ENV = args[0] || "dev";
console.log(`--------打包环境：${ENV}--------`);

module.exports = {
  publishEnv: config[ENV], // 发布环境
  buildDist: "dist", // 前端文件打包之后的目录，默认dist
  buildCommand: "npm run build", // 打包前端文件的命令
  readyTimeout: 20000, // ssh连接超时时间
  deleteFile: true, // 是否删除线上上传的dist压缩包
  isNeedBuild: true // s是否需要打包
};
