const path = require("path");
const Config = require("./config.js");
const chalk = require("chalk");
// 前端打包文件的目录
const rootDir = path.resolve(__dirname, "..");
// 引入SSH、FILE
const SSH = require("./ssh");
const FILE = require("./file");

// SSH连接，上传，解压，删除等相关操作
async function sshUpload(sshConfig, fileName) {
  const sshCon = new SSH(sshConfig);
  const sshRes = await sshCon.connectServer().catch(e => {
    console.error(e);
  });
  if (!sshRes || !sshRes.success) {
    const desc =
      "*******************************************\n" +
      "***             ssh连接失败             ***\n" +
      "*******************************************\n";
    console.log(chalk.red(desc));
    return false;
  }
  let desc =
    "*******************************************\n" +
    "***     连接服务器成功，开始上传文件    ***\n" +
    "*******************************************\n";
  console.log(chalk.green(desc));

  // 判断文件是否存在，如果不存在则进行创建文件夹
  await sshCon.execSsh(
    `
    if [[ ! -d ${sshConfig.catalog} ]];
    then
      mkdir -p ${sshConfig.catalog}
    fi
    `
  );

  // 备份文件夹内所有文件到backup.zip
  if (sshConfig.catalog) {
    desc =
      "*******************************************\n" +
      "***             备份服务器文件          ***\n" +
      "*******************************************\n";
    console.log(chalk.green(desc));

    const lastIndex = sshConfig.catalog.lastIndexOf("/");
    const dir = sshConfig.catalog.slice(0, lastIndex);
    const folder = sshConfig.catalog.slice(lastIndex + 1);

    await sshCon.execSsh(
      `tar cvf ${sshConfig.catalog}/backup.tar -C ${dir} ${folder}`
    );
  }

  const uploadRes = await sshCon
    .uploadFile({
      localPath: path.join(rootDir, "/", fileName),
      remotePath: sshConfig.catalog + "/" + fileName
    })
    .catch(e => {
      console.error(e);
    });
  if (!uploadRes || !uploadRes.success) {
    console.error("----上传文件失败，请重新上传----");
    return false;
  }

  desc =
    "*******************************************\n" +
    "***      上传文件成功，开始解压文件     ***\n" +
    "*******************************************\n";
  console.log(chalk.green(desc));
  const zipRes = await sshCon.execSsh(
    `unzip -o ${sshConfig.catalog + "/" + fileName} -d ${sshConfig.catalog}`
  );
  if (!zipRes || !zipRes.success) {
    console.error("----解压文件失败，请手动解压zip文件----");
    console.error(`----错误原因：${zipRes.error}----`);
    return false;
  } else if (Config.deleteFile) {
    desc =
      "*******************************************\n" +
      "***  解压文件成功，开始删除上传的压缩包 ***\n" +
      "*******************************************\n";
    console.log(chalk.green(desc));
    // 注意：rm -rf为危险操作，请勿对此段代码做其他非必须更改
    const deleteZipRes = await sshCon.execSsh(
      `rm -rf ${sshConfig.catalog + "/" + fileName}`
    );
    if (!deleteZipRes || !deleteZipRes.success) {
      console.log(chalk.pink("----删除文件失败，请手动删除zip文件----"));
      console.log(chalk.red(`----错误原因：${deleteZipRes.error}----`));
      return false;
    }
  }

  // 结束ssh连接
  sshCon.endConn();
  return true;
}

// 执行前端部署
(async () => {
  const file = new FILE();
  let desc =
    "*******************************************\n" +
    "***              开始编译               ***\n" +
    "*******************************************\n";
  if (Config.isNeedBuild) {
    console.log(chalk.green(desc));
    // 打包文件
    const buildRes = await file.buildProject().catch(e => {
      console.error(e);
    });
    if (!buildRes || !buildRes.success) {
      desc =
        "*******************************************\n" +
        "***          打包出错，请检查错误         ***\n" +
        "*******************************************\n";
      console.log(chalk.red(desc));
      return false;
    }
    console.log(chalk.blue(buildRes.stdout));
    desc =
      "*******************************************\n" +
      "***              编译成功               ***\n" +
      "*******************************************\n";
    console.log(chalk.green(desc));
  }
  // 压缩文件
  const res = await file
    .zipFile(path.join(rootDir, "/", Config.buildDist))
    .catch(() => {});
  if (!res || !res.success) return false;
  desc =
    "*******************************************\n" +
    "***              开始部署               ***\n" +
    "*******************************************\n";
  console.log(chalk.green(desc));

  const bol = await sshUpload(Config.publishEnv, file.fileName);
  if (bol) {
    desc =
      "\n******************************************\n" +
      "***              部署成功              ***\n" +
      "******************************************\n";
    console.log(chalk.green(desc));
    file.stopProgress();
  } else {
    process.exit(1);
  }
})();
