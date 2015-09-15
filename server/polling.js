process.env.MAIL_URL = "smtp://316322415%40qq.com:cjy910823@smtp.qq.com:465/";


// 挨个查看服务状态
var services = config.db.Service.find({}).fetch();
_.each(services, function (service) {
  // etcd中查找服务
  var serviceObj = Etcd.getServiceNode(service.name);

  // etcd中没有服务
  if (!serviceObj){
    // TODO alert();
    return ;
  }

  // 服务节点数目不满足要求
  if (service.minNodeCount && serviceObj.length < service.minNodeCount){
    // TODO alert();
    return ;
  }

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
  config.db.Service.update({'_id': service._id}, {$set: {nodes: updateNodes}}, {upsert: true});
})

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

// service状态达到警戒线
function serviceAlert (service){
  // sendEmail();
  // sendMsg();
  // Email.send({
  //   to: '316322415@qq.com',
  //   from: '316322415@qq.com',
  //   subject: 'Hello from Meteor!',
  //   text: 'This is a test of Email.send.'
  // });
  return ;
}
