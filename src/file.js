const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const JSZIP = require("jszip");

// new zip对象
const zip = new JSZIP();
// 前端打包文件的目录
const rootDir = path.resolve(__dirname, "../../..");

/*
 * 本地操作
 * */
class FILE {
  constructor(fileName) {
    this.fileName = this.formateName(fileName);
  }

  // 删除本地文件
  deleteLocalFile() {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(rootDir, "/", this.fileName), function(error) {
        if (error) {
          const desc =
            "*******************************************\n" +
            "***            本地文件删除失败          ***\n" +
            "*******************************************\n";
          console.log(chalk.yellow(desc));
          reject(error);
        } else {
          const desc =
            "*******************************************\n" +
            "***              删除成功               ***\n" +
            "*******************************************\n";
          console.log(chalk.blue(desc));
          resolve({
            success: true
          });
        }
      });
    });
  }

  // 读取文件
  readDir(obj, nowPath) {
    const files = fs.readdirSync(nowPath); // 读取目录中的所有文件及文件夹（同步操作）
    files.forEach((fileName, index) => {
      // 遍历检测目录中的文件
      console.log(fileName, index); // 打印当前读取的文件名
      const fillPath = nowPath + "/" + fileName;
      const file = fs.statSync(fillPath); // 获取一个文件的属性
      if (file.isDirectory()) {
        // 如果是目录的话，继续查询
        const dirlist = zip.folder(fileName); // 压缩对象中生成该目录
        this.readDir(dirlist, fillPath); // 重新检索目录文件
      } else {
        obj.file(fileName, fs.readFileSync(fillPath)); // 压缩目录添加文件
      }
    });
  }

  // 压缩文件夹下的所有文件
  zipFile(filePath) {
    return new Promise((resolve, reject) => {
      let desc =
        "*******************************************\n" +
        "***               正在压缩              ***\n" +
        "*******************************************\n";
      console.log(chalk.blue(desc));
      this.readDir(zip, filePath);
      zip
        .generateAsync({
          // 设置压缩格式，开始打包
          type: "nodebuffer", // nodejs用
          compression: "DEFLATE", // 压缩算法
          compressionOptions: {
            // 压缩级别
            level: 9
          }
        })
        .then(content => {
          fs.writeFileSync(
            path.join(rootDir, "/", this.fileName),
            content,
            "utf-8"
          );
          desc =
            "*******************************************\n" +
            "***               压缩成功              ***\n" +
            "*******************************************\n";
          console.log(chalk.green(desc));
          resolve({
            success: true
          });
        })
        .catch(err => {
          console.log(chalk.red(err));
          reject(err);
        });
    });
  }

  // 打包本地前端文件
  buildProject(buildCommand) {
    return new Promise((resolve, reject) => {
      exec(buildCommand, async (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          reject(error);
        } else if (stdout) {
          resolve({
            stdout,
            success: true
          });
        } else {
          console.error(stderr);
          reject(stderr);
        }
      });
    });
  }

  // 停止程序之前需删除本地压缩包文件
  stopProgress() {
    this.deleteLocalFile()
      .catch(e => {
        console.log(chalk.red("----删除本地文件失败，请手动删除----"));
        console.log(chalk.red(e));
        process.exit(1);
      })
      .then(() => {
        const desc =
          "*******************************************\n" +
          "***         已删除本地压缩包文件        ***\n" +
          "*******************************************\n";
        console.log(chalk.green(desc));
        process.exitCode = 0;
      });
  }

  // 格式化命名文件名称
  formateName(fileName) {
    // 压缩包的名字
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const timeStr = `${year}_${month}_${day}`;
    return `${fileName}-${timeStr}-${Math.random()
      .toString(16)
      .slice(2)}.zip`;
  }
}

module.exports = FILE;
