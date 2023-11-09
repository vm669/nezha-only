const username = process.env.WEB_USERNAME || "admin";
const password = process.env.WEB_PASSWORD || "password";
const port = process.env.PORT || 3000;
const url = `http://127.0.0.1:${port}`;
const express = require("express");
const app = express();
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");
const auth = require("basic-auth");

app.get("/", function (req, res) {
  res.send("hello world");
});

// 页面访问密码
app.use((req, res, next) => {
  const user = auth(req);
  if (user && user.name === username && user.pass === password) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Node"');
  return res.status(401).send();
});

//获取系统进程表
app.get("/status", function (req, res) {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>系统进程表：\n" + stdout + "</pre>");
    }
  });
});

//获取系统监听端口
app.get("/listen", function (req, res) {
    let cmdStr = "ss -nltp";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
      } else {
        res.type("html").send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
      }
    });
  });

//获取系统版本、内存信息
app.get("/info", function (req, res) {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    }
    else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

//文件系统只读测试
app.get("/test", function (req, res) {
    let cmdStr = 'mount | grep " / " | grep "(ro," >/dev/null';
    exec(cmdStr, function (error, stdout, stderr) {
      if (error !== null) {
        res.send("系统权限为---非只读");
      } else {
        res.send("系统权限为---只读");
      }
    });
  });

// keepalive begin
//web保活
function keep_web_alive() {
  // 请求主页，保持唤醒
  exec("curl -m8 " + url , function (err, stdout, stderr) {
    if (err) {
      console.log("保活-请求主页-命令行执行错误：" + err);
    }
    else {
      console.log("保活-请求主页-命令行执行成功，响应报文:" + stdout);
    }
  });
}
setInterval(keep_web_alive, 30 * 1000);

//启动核心脚本运行web,哪吒和argo
exec("bash entrypoint.sh", function (err, stdout, stderr) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));