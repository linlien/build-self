const Client = require("ssh2").Client;
const chalk = require("chalk");

/**
 * ssh连接
 */
class SSH {
  constructor({ host, port, username, password, privateKey }) {
    this.server = {
      host,
      port,
      username,
      password,
      privateKey
    };
    this.conn = new Client();
  }

  // 连接服务器
  connectServer() {
    return new Promise((resolve, reject) => {
      const conn = this.conn;
      conn
        .on("ready", () => {
          const desc =
            "*******************************************\n" +
            "***              SSH准备连接            ***\n" +
            "*******************************************\n";
          console.log(chalk.green(desc));
          resolve({
            success: true
          });
        })
        .on("error", err => {
          const desc =
            "*******************************************\n" +
            "***              SSH连接错误            ***\n" +
            "*******************************************\n";
          console.log(chalk.red(desc));
          reject(err);
        })
        .on("end", () => {
          const desc =
            "*******************************************\n" +
            "***              SSH连接已结束          ***\n" +
            "*******************************************\n";
          console.log(chalk.green(desc));
        })
        .on("close", () => {
          const desc =
            "*******************************************\n" +
            "***              SSH连接已关闭          ***\n" +
            "*******************************************\n";
          console.log(chalk.green(desc));
        })
        .on("connect", () => {
          const desc =
            "*******************************************\n" +
            "***              SSH正在连接            ***\n" +
            "*******************************************\n";
          console.log(chalk.green(desc));
        })
        .connect(this.server);
    });
  }

  // 上传文件
  uploadFile({ localPath, remotePath }) {
    return new Promise((resolve, reject) => {
      return this.conn.sftp((err, sftp) => {
        if (err) {
          reject(err);
        } else {
          sftp.fastPut(localPath, remotePath, (err, result) => {
            if (err) {
              reject(err);
            }
            resolve({
              success: true,
              result
            });
          });
        }
      });
    });
  }

  // 执行ssh命令
  execSsh(command) {
    return new Promise((resolve, reject) => {
      return this.conn.exec(command, (err, stream) => {
        if (err || !stream) {
          reject(err);
        } else {
          stream
            .on("close", () => {
              resolve({
                success: true
              });
            })
            .on("data", data => {
              console.log(data);
            })
            .stderr.on("data", data => {
              resolve({
                success: false,
                error: data.toString()
              });
            });
        }
      });
    });
  }

  // 结束连接
  endConn() {
    this.conn.end();
    if (this.connAgent) {
      this.connAgent.end();
    }
  }
}

module.exports = SSH;
