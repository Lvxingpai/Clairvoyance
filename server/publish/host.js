/**
 * Created by apple on 15-9-25.
 */
var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');

Meteor.methods({
    // 获取服务器列表
    'qingcloud.getHostList': function(){
        var qingDescribeInstances = Async.wrap(Qing.DescribeInstances);
        var result = qingDescribeInstances({
            zone: 'pek2',
            verbose: 1
        });
        return result;
    },

    // 获取服务器相关信息
    // options: startTime, endTime, step, types
    'qingcloud.getHostDesc': function(resourceId, zone, options) {
        var qingGetMonitor = Async.wrap(Qing.GetMonitor);
        var options = options || {};
        var endTime = (options.endTime) ? new Date(options.endTime) : new Date();
        var startTime = (options.startTime) ? new Date(options.startTime) :  new Date(endTime.getTime() - 60 * 60 * 1000);
        var step;
        if (! options.step){
            var interval = Math.max(Date.now() - endTime.getTime(), endTime.getTime() - startTime.getTime());
            step = '5m';
            if (interval > 0){
                if (interval >= 30 * 24 * 60 * 60 * 1000) {// 30d
                    step = '1d';
                }else if (interval >= 15 * 24 * 60 * 60 * 1000){// 15d
                    step = '2h';
                }else if (interval >= 6 * 60 * 60 * 1000 ) {// 6h
                    step = '15m';
                };
            };
        } else {
            step = options.step;
        };
        var result = qingGetMonitor({
            zone: zone || 'pek2',
            resource: resourceId, //资源的ID
            'meters.n': options.types || ['cpu', 'memory', 'disk-os', 'disk-iops-os', 'disk-us-os'], //监控项
            step: step, //数据间隔时间
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
        });
        return result;
    }
});

Meteor.publish('hostList', function(){
    var self = this;
    Meteor.call('qingcloud.getHostList', function(error, result){
        if (result){
            self.added("Host", 'hostList', result);
            self.ready();
        } else {
            self.ready();
        }
    });
});

// defetched => use meteor.call directly
//Meteor.publish('hostDesc', function(){
//    var self = this;
//    console.log('hostdesc');
//    Meteor.call('qingcloud.getHostDesc', function(error, result){
//        if (result){
//            self.added("Host", Date.now(), result);
//            self.ready();
//        } else {
//            self.ready();
//        }
//    });
//});