// 还在使用旧的etcd类
// 监控管理器
AlarmManagerClass = function () {
    this.alarmList = {};//记录每个服务与对应的timer
    this.alarmInterval = 6 * 60 * 60 * 1000;//警报间隔

    // 根据一个service建立一个alarm对象
    this.createAlarm = function (service) {
        var self = this;
        var interval = service.alert.interval || 60;
        var intervalId = Meteor.setInterval(function () {
            // etcd中查找服务
            var serviceObj = self._getEtcdServiceNode(service);

            // 根据validation来检测每个结点的服务状态
            var updateNodes = [];
            var serviceStatus = false;

            // TODO 假如没有ping的，直接就显示成功就好了？
            _.each(serviceObj, function (node) {
                // 发送ping请求, TODO 其它类型请求的构造
                var responseData,
                    nodeStatus = 'Failure';
                if (service.alert.ping.type === 'http') {
                    // 构造请求的url
                    var host = node.value.split(':')[0];
                    var callUrl = (service.alert.ping.port)
                        ? host + ':' + service.alert.ping.port
                        : node.value;
                    callUrl = 'http://' + callUrl + service.alert.ping.entrypoint;

                    // 发送请求
                    try {
                        var response = HTTP.call('GET', callUrl);
                    } catch (e) {
                        console.log(service.name + ' 服务的节点中 ' + callUrl + ' 无法连通');
                        console.log(e);
                    }

                    if (response && response.statusCode == 200)
                        responseData = JSON.parse(response.content);
                }

                // 检测返回的数据的正确性
                if (responseData && self._validateResponse(service.alert.ping.validation, responseData)) {
                    nodeStatus = 'OK';
                    serviceStatus = true;
                }

                // 存储当前结点
                updateNodes.push({
                    id: _.last(node.key.split('/')),
                    endpoint: node.value,
                    status: nodeStatus
                });
            });

            // 假如没有一个结点是ok的，则alert()
            if (!serviceStatus) {
                self.serviceAlert(service);
            } else {
                if (!service.status || service.status != 'running') {
                    DB.Service.update({'name': service.name}, {$set: {status: 'running'}}, {upsert: true});
                }
            }

            // 更新数据库
            DB.Service.update({'name': service.name}, {$set: {nodes: updateNodes}}, {upsert: true});
        }, interval * 1000);

        this.alarmList[service.name] = {
            intervalId: intervalId,
        };
        return intervalId;
    };

    // 获取服务对应的etcd节点
    this._getEtcdServiceNode = function (service) {
        var serviceObj = Etcd.getServiceNode(service.name);

        // etcd中没有服务
        if (!serviceObj) {
            this.serviceAlert(service);
            return;
        }

        // 服务节点数目不满足要求
        if (service.minNodeCount && serviceObj.length < service.minNodeCount) {
            this.serviceAlert(service);
            return;
        }

        return serviceObj;
    };

    // 根据服务的validation验证服务器返回的response的正确性
    this._validateResponse = function (validation, res) {
        // TODO 其它格式的扩展
        if (validation && validation.type === 'json') {
            if (this._isCorrectValue(validation.should[0].key.split('.'), validation.should[0].value, res)) {
                return true;
            } else {
                return false;
            }
        }
    };

    // 判断res中对应keys的值是否为value
    this._isCorrectValue = function (keys, value, res) {
        // 边界条件
        if (keys.length == 1) {
            return (res[keys[0]] == value);
        }

        if (res[keys[0]])
            return this._isCorrectValue(_.rest(keys), value, res[keys[0]]);

        return false;
    }

    // service状态达到警戒线的处理
    this.serviceAlert = function (service) {
        var self = this;
        DB.Service.update({'name': service.name}, {$set: {status: 'stop'}}, {upsert: true});

        // 判断服务是否未到达警报时间间隔
        if (service.alert.lastTriggered && ((Date.now() - service.alert.lastTriggered) < this.alarmInterval)) {
            console.log('服务 ' + service.name + ' 已经上锁');
            return;
        }

        var alertPolicy = DB.AlertPolicy.find({name: service.alert.policy}).fetch();
        if (alertPolicy.length > 1) {
            console.log('AlertPolicy出现重复的 ' + service.alert.policy);
        }

        if (alertPolicy.length < 1) {
            console.log('AlertPolicy出现重复的 ' + service.alert.policy);
        }

        // 获取需要通知的user
        var users = [];
        users = _.union(users, alertPolicy[0].users);
        if (alertPolicy[0].groups) {
            _.each(alertPolicy[0].groups, function (group) {
                users = _.union(users, getGroupUsers(group));
            })
        }

        // 发送警报
        _.each(users, function (username) {
            self.alertUser(service.name, username, alertPolicy[0]);
        })

        console.log(service.name);
        // 更新时间警报
        DB.Service.update({'name': service.name}, {$set: {'alert.lastTriggered': Date.now()}}, {upsert: true});
        return;
    };

    // 发送警报给user
    this.alertUser = function (servicename, username, alertPolicy) {
        var user = Meteor.users.findOne({username: username});

        if (!user) {
            console.log(alertPolicy.name + ' 报警策略中的用户 ' + username + '不存在');
            return false;
        }

        if (alertPolicy.action.indexOf('email') !== -1) {
            console.log('send email');
            // this.sendAlertEmail(servicename, user.emails[0].address);
        }

        if (alertPolicy.action.indexOf('sms') !== -1) {
            console.log('send sms');
            // this.sendAlertSms(servicename, user.profile.tel);
        }
    };

    // 发送警报邮件
    // function sendEmail(serviceName, address ,errorNumber){
    this.sendAlertEmail = function (serviceName, address) {
        var send = Email.send({
            to: address,
            from: '316322415@qq.com',
            subject: serviceName + '服务警报',
            // text: serviceName + '服务出错:' + error
            text: serviceName + '服务出现错误'
            // TODO 出错服务，出错节点，出错原因，出错时间
        });
        return send;
    };

    // 发送警报短信
    this.sendAlertSms = function (serviceName, tel) {
        var text = serviceName + '服务出现错误';
        var send = Meteor.call('smsCenter.sendSmsFunc', text, [tel]);
        return send;
    };

    // 删除一个警报器
    this.deleteAlarm = function (service){
        if (this.alarmList[service.name]){
            clearInterval(this.alarmList[service.name].intervalId);
            this.alarmList[service.name] = undefined;
            return true;
        }
        return false;
    }
}

// 根据组名，获取用户
function getGroupUsers(group) {
    // TODO 根据group在users collection中查找相应的user
    return [];
}

Meteor.methods({
    'alarm.deleteAlarm': function(service){
        check(service, Object);
        return AlarmManager.deleteAlarm(service);
    },

    //栈溢出...先直接调用AlarmManeger
    //'alarm.createAlarm': function(service){
    //    check(service, Object);
    //    return AlarmManager.createAlarm(service);
    //}
})

