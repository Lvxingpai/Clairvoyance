// 当前并不执行，只有在server运行时才执行，相当于运行前的初始化准备
Meteor.startup(function () {
    // 获取etcd的后台服务列表
    getEtcdSetting();

    // 建立sms服务
    createSmsService();

    // 建立报警器
    createAlarm();

    // 获取etcd上的配置
    getNewEtcd();

    // TODO 封装一个QingCloud以供使用 => 用meteor method来封装
    // 引入qingcloud的API
    var qing = Meteor.npmRequire('lxp-qingcloud');
    qing['access_key_id'] = Config.qingcloud.accessKey;
    qing['secret_access_key'] = Config.qingcloud.secretKey;

    //qing.DescribeInstances({zone: 'pek2'}, function(err, data){
    //    if(err)
    //        console.log(err.message);
    //    else
    //        console.log(data);
    //});

    qing.GetMonitor({
        zone: 'pek2',
        resource: 'i-mq0zy1mx', //资源的ID
        'meters.n': ['cpu', 'memory', 'disk-os', 'disk-iops-os', 'disk-us-os'], //监控项
        step: '15m', //数据间隔时间
        start_time: '2015-09-10T11:07:00.520Z',
        end_time: '2015-09-10T19:07:00.520Z'
    }, function(err, data){
        if(err)
            console.log(err.message);
        else
            console.log(data);
    });

    // 设置session过期日期为一天
    Accounts.config({
        loginExpirationInDays: 1
    });
});

// 获取etcd的后台服务列表
function getEtcdSetting(){
    Etcd = new EtcdClass(process.env.ETCD_URL);
    _.extend(Etcd, {
        data: {
            'project-conf': Etcd.callEtcd('project-conf'),
            'backends': Etcd.callEtcd('backends')
        }
    });

    if (!Etcd.data['backends']) {
        console.log('未获取到后台服务列表，请检查etcd！');
    }
}

// 建立sms服务
function createSmsService(){
    smsCenter = new ThriftClass('smscenter', 'lxp-sms-thrift', ['SmsCenter']);
    smsCenter.createService();
}

// 建立报警器
function createAlarm(){
    AlarmManager = new AlarmManagerClass();
    var services = DB.Service.find({}).fetch();
    _.each(services, function (service) {
        AlarmManager.createAlarm(service);
    });
}

// 用新的Etcd类
function getNewEtcd(){
    var builder = new EtcdHelper.EtcdConfigBuilder(["192.168.100.2:2379", "192.168.100.3:2379", "192.168.100.4:2379"]);
    builder.addEntry(["clairvoyance", "clairvoyance"]);
    var config = builder.build();
    Config.qingcloud = config.clairvoyance.qingcloud;
}