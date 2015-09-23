// 当前并不执行，只有在server运行时才执行，相当于运行前的初始化准备
Meteor.startup(function () {
    // 获取配置对象
    config = new Config();

    // 获取etcd的后台服务列表
    Etcd = new EtcdClass(config.ETCD_URL);
    _.extend(Etcd, {
        data: {
            'project-conf': Etcd.callEtcd('project-conf'),
            'backends': Etcd.callEtcd('backends')
        }
    })
    if (!Etcd.data['backends']) {
        console.log('未获取到后台服务列表，请检查etcd！');
    }

    // sms
    smsCenter = new ThriftClass('smscenter', 'lxp-sms-thrift', ['SmsCenter']);
    smsCenter.createService();

    // 建立报警器
    AlarmManager = new AlarmManagerClass();
    var services = config.db.Service.find({}).fetch();
    _.each(services, function (service) {
        AlarmManager.createAlarm(service);
    });

    // 设置session过期日期为一天
    Accounts.config({
        loginExpirationInDays: 1
    });
});