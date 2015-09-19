var thrift = Meteor.npmRequire('thrift');

ThriftClass = function (serverName, serverPackageName, serviceList) {
    // 初始化
    this.serverName = serverName;//服务在etcd中的名称
    this.serverPackageName = serverPackageName;//服务在npm中的包名
    this.serviceList = serviceList;//服务中的service列表
    // this.apiList = apiList;//service中的api列表
    this.transportTypeList = ['TFramedTransport', 'TBufferedTransport'];
    this.protocolTypeList = ['TBinaryProtocol', 'TJSONProtocol', 'TCompactProtocol'];

    // 建立thrift服务的实例
    this.createService = function () {
        var address = this.getServerAddress(this.serverName).split(':');
        var connection = this.connectServer(address[0], address[1]);
        this.createClient(connection);
    };

    /**
     * 获取thrift服务的地址
     * @param  {string} serverName  服务在etcd中的的名称
     * @param  {number} etcdIndex   需要的节点的下标
     * @return [string]             返回[host, port]
     */
    this.getServerAddress = function (serverName, etcdIndex) {
        var index = etcdIndex || 0;
        var serverNode = Etcd.getServiceNode(serverName);
        return serverNode[index].value;
    }

    /**
     * 建立thrift客户端
     * @param  {object} connection        thrift的连接对象
     */
    this.createClient = function (connection) {
        var self = this;
        try {
            var serviceModule = Meteor.npmRequire(this.serverPackageName);
            _.each(this.serviceList, function (serviceName) {
                if (!serviceModule[serviceName]) {
                    console.log('服务的thrift package中无法找到 ' + serviceName + ' 服务');
                    return;
                }
                var service = serviceModule[serviceName];
                var client = thrift.createClient(service, connection);
                self.attachApi(serviceName, client);
            });
        } catch (e) {
            console.log(e);
            console.log('未找到node package:' + this.serverPackageName);
        }
    }

    /**
     * 连接服务器
     * @param  {string} host          thrift服务器的host
     * @param  {string} port          thrift服务器的端口
     * @param  {string} transportType 传输协议类型
     * @param  {string} protocolType  数据类型
     * @return {object}               返回thirift连接的实例
     */
    this.connectServer = function (host, port, transportType, protocolType) {
        var self = this;
        // IP检查
        if (!host) {
            console.log('请指定 thrift server的IP地址!');
            return;
        }
        if (!port) {
            console.log('请指定 thrift server的端口号!');
            return;
        }

        // 默认协议
        var transportType = transportType || 'TFramedTransport';
        var protocolType = protocolType || 'TBinaryProtocol';

        // 协议检查
        if (this.transportTypeList.indexOf(transportType) === -1) {
            console.log('输入的数据传输格式错误');
            console.log("请从['TFramedTransport', 'TBufferedTransport']中选取");
            return;
        }
        if (this.protocolTypeList.indexOf(protocolType) === -1) {
            console.log('输入的传输协议错误');
            console.log("请从['TBinaryProtocol', 'TJSONProtocol', 'TCompactProtocol']中选取");
            return;
        }

        // 建立连接
        var transport = Meteor.npmRequire('thrift/lib/thrift/transport')[transportType],
            protocol = Meteor.npmRequire('thrift/lib/thrift/protocol')[protocolType],
            connection = thrift.createConnection(host, port, {
                transport: transport,
                protocol: protocol
            });

        // 失败重连
        connection.on('error', function (err) {
            console.log('Connection Failed!');
            console.log(err);

            // 重新建立连接
            self.createService();
        });

        return connection;
    }

    /**
     * 将服务的api绑定在Meteor.lxp上
     * @param  {string} serviceName       thrift模块中的服务名
     * @param  {object} client            已建立的客户端服务
     */
    this.attachApi = function (serviceName, client) {
        var apiList = this.getApiList(serviceName);
        this[serviceName] = Async.wrap(client, apiList);
        return this;
    }

    /**
     * 获取api列表(有待改进，目前直接写, 可以直接遍历thrift?)
     * @param  {string} serviceName 服务名称，如SmsCenter
     * @return [srting]             服务名对应的api列表
     */
    this.getApiList = function (serviceName) {
        var serviceList = {
            SmsCenter: ['_ping', 'sendSms'],
            // Userservice: ['login', 'getUserById', 'updateUserInfo', 'isContact', 'addContact', 'addContacts',
            // 'removeContact', 'removeContacts', 'getContactList', 'createUser', 'createChatGroup', 'updateChatGroup',
            // 'getChatGroup', 'getUserChatGroups', 'addChatGroupMembers', 'removeChatGroupMembers', 'getChatGroupMembers',
            // 'acceptContactRequest', 'rejectContactRequest', 'cancelContactRequest'],
            // TODO add more client api
        };
        return serviceList[serviceName];
    }
}

