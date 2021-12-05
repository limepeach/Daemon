/*
 * @Author: Copyright(c) 2020 Suwings
 * @Date: 2021-03-24 19:51:50
 * @LastEditTime: 2021-08-14 16:59:20
 * @Description:
 * @Projcet: MCSManager Daemon

 */

import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";
import SendCommand from "../cmd";

export default class GeneralStopCommand extends InstanceCommand {
  constructor() {
    super("StopCommand");
  }

  async exec(instance: Instance) {
    const stopCommand = instance.config.stopCommand;
    if (instance.status() === Instance.STATUS_STOP || !instance.process) return instance.failure(new Error("实例未处于运行中状态，无法进行停止."));

    instance.status(Instance.STATUS_STOPPING);

    if (stopCommand.toLocaleLowerCase() == "^c") {
      instance.process.kill("SIGINT");
    } else {
      await instance.exec(new SendCommand(stopCommand));
    }
    const cacheStartCount = instance.startCount;
    // 若 10 分钟后实例还处于停止中状态，则恢复状态
    setTimeout(() => {
      if (instance.status() === Instance.STATUS_STOPPING && instance.startCount === cacheStartCount) {
        instance.println("ERROR", "关闭命令已发出但长时间未能关闭实例，可能是实例关闭命令错误或实例进程假死导致，现在将恢复到运行中状态，可使用强制终止指令结束进程。");
        instance.status(Instance.STATUS_RUNNING);
      }
    }, 1000 * 60 * 10);

    return instance;
  }
}