/**
 * Meteor启动时的动作
 */


var services = config.db.Service.find({}).fetch();

_.each(services, function (service) {
    AlarmManager.createAlarm(service);
});

var winston = Meteor.npmRequire('winston');

var _initLogging = function() {
    winston.loggers.add("default", {
        console: {
            level: "info",
            colorize: true,
            label: "default"
        }
    });
};

// 当前并不执行，只有在server运行时才执行，相当于运行前的初始化准备
Meteor.startup(function () {
    _initLogging();

    var logger = winston.loggers.get("default");
    logger.info("Server started");

    // 设置session过期日期为一天
    Accounts.config({
        loginExpirationInDays: 1
    });
});