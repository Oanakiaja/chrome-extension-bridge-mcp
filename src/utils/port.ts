/* eslint-disable @typescript-eslint/no-unused-vars */
import { execSync } from "child_process";

const poll = (cond: () => boolean, rate: number = 1000) => {
  return new Promise<void>((resolve) => {
    const id = setInterval(() => {
      if (cond()) {
        clearInterval(id);
        resolve();
      }
    }, rate);
  });
};

export const findPid = (port: number) => {
  if (process.platform === "win32") {
    try {
      return execSync(`netstat -ano | findstr 0.0.0.0:${port}`)
        .toString()
        .trim()
        .split(" ")
        .pop();
    } catch (e) {
      return "";
    }
  }
  return execSync(`lsof -i :${port} | grep LISTEN | awk '{print $2}'`)
    .toString()
    .trim();
};

export const kill = (pid: string) => {
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /F /PID ${pid}`);
    } catch (e: unknown) {
      return;
    }
    return;
  }
  execSync(`kill -9 ${pid}`);
};

export const occupiedPort = async (port: number) => {
  try{
    const pid = findPid(port);
    if (pid) {
      kill(pid);
    }
  
    await poll(() => !findPid(port));
  } catch (e) {
    return false;
  }
  return true;
};
