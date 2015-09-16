var db = config.db;

// 挨个查看服务状态
var services = db.Service.find({}).fetch();
_.each(services, function (service) {
  var intervalNode = Meteor.setInterval(function(){
    // etcd中查找服务
    var serviceObj = getEtcdServiceNode(service);

    // 根据validation来检测每个结点的服务状态
    var updateNodes = [];
    var serviceStatus = false;
    _.each(serviceObj, function (node) {
      // 发送ping请求, TODO 其它类型请求的构造
      var responseData,
          nodeStatus = 'Failure';
      if (service.alert.ping.type === 'http'){
        // 构造请求的url
        var host = node.value.split(':')[0];
        var callUrl = (service.alert.ping.port)
          ? host + ':' + service.alert.ping.port
          : node.value;
        callUrl = 'http://' + callUrl + service.alert.ping.entrypoint;

        // 发送请求
        try{
          var response = HTTP.call('GET', callUrl);
        } catch (e){
          console.log(service.name + ' 服务的节点中 ' + callUrl + ' 无法连通');
          console.log(e);
        }

        if (response && response.statusCode == 200)
          responseData = response.data;
      }

      // 检测返回的数据的正确性
      if (responseData && validate(service.alert.validation, responseData)){
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
    if (! serviceStatus){
      serviceAlert(service);
    }

    // 更新数据库
    db.Service.update({'_id': service._id}, {$set: {nodes: updateNodes}}, {upsert: true});
  }, service.alert.interval * 1000);
})

// 获取服务对应的etcd节点
function getEtcdServiceNode(service){
  var serviceObj = Etcd.getServiceNode(service.name);

  // etcd中没有服务
  if (!serviceObj){
    serviceAlert(service);
    return ;
  }

  // 服务节点数目不满足要求
  if (service.minNodeCount && serviceObj.length < service.minNodeCount){
    serviceAlert(service);
    return ;
  }

  return serviceObj;
}

// 根据服务的validation验证服务器返回的response的正确性
function validate(validation, res){
  // TODO 其它格式的扩展
  if (validation && validation.type === 'json'){
    if (isValidValue(validation.should[0].key.split('.'), validation.should[0].value, res)){
      return true;
    } else {
      return false;
    }
  }
}

// 判断res中对应keys的值是否为value
function isValidValue(keys, value, res){
  // 边界条件
  if (keys.length == 1){
    return (res[keys[0]] == value);
  }

  if (res[keys[0]])
    return isValidValue(_.rest(keys), value, res[keys[0]]);

  return false;
}

// service状态达到警戒线的处理
function serviceAlert (service){
  var alertPolicy = db.AlertPolicy.find({name: service.alert.policy}).fetch();
  if (alertPolicy.length > 1){
    console.log('AlertPolicy出现重复的 ' + service.alert.policy);
  }

  if (alertPolicy.length < 1){
    console.log('AlertPolicy出现重复的 ' + service.alert.policy);
  }

  // 获取需要通知的user
  var users = [];
  users = _.union(users, alertPolicy[0].users);
  if (alertPolicy[0].groups){
    _.each(alertPolicy[0].groups, function(group){
      users = _.union(users, getGroupUsers(group));
    })
  }

  // 发送警报
  _.each(users, function(username){
    var user = Meteor.users.findOne({username: username});

    if (! user){
      console.log(service.alert.policy + ' 中的用户 ' + username + '不存在');
      return false;
    }

    if (alertPolicy[0].action.indexOf('email') !== -1){
      // sendAlertEmail(service.name, user.emails[0].address);
    }

    if (alertPolicy[0].action.indexOf('sms') !== -1){
      // sendAlertSms(service.name, user.profile.tel);
    }
  })
  return ;
}

// 根据组名，获取用户
function getGroupUsers (group){
  // TODO 根据group在users collection中查找相应的user
  return [];
}

// 发送警报邮件
// function sendEmail(serviceName, address ,error){
function sendAlertEmail(serviceName, address){
  var send = Email.send({
    to: address,
    from: '316322415@qq.com',
    subject: serviceName + '服务警报',
    // text: serviceName + '服务出错:' + error
    text: serviceName + '服务出现错误'
    // TODO 出错服务，出错节点，出错原因，出错时间
  });
  return send;
}

// 发送警报短信
function sendAlertSms(serviceName, tel){
  var text = serviceName + '服务出现错误';
  var send = smsCenter.sendSmsFunc(text, [tel]);
  return send;
}
