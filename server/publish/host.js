/**
 * Created by apple on 15-9-25.
 */
var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');

Meteor.methods({
    'qingcloud.getHostList': function(){
        var qingDescribeInstances = Async.wrap(Qing.DescribeInstances);
        var result = qingDescribeInstances({
            zone: 'pek2',
            verbose: 1
        });
        //var future = new Future;
        //Qing.DescribeInstances({zone: 'pek2'}, function(err, data){
        //    if(err){
        //        console.log(err.message);
        //    }else{
        //        console.log(data);
        //        fiber.return(data);
        //    }
        //});
        return result;
    },

    'qingcloud.getHostDesc': function(resourceId) {
        var qingGetMonitor = Async.wrap(Qing.GetMonitor);
        var result = qingGetMonitor({
            zone: 'pek2',
            resource: resourceId, //资源的ID
            'meters.n': ['cpu', 'memory', 'disk-os', 'disk-iops-os', 'disk-us-os'], //监控项
            step: '5m', //数据间隔时间
            start_time: '2015-09-09T11:30:00.520Z',
            end_time: '2015-09-09T12:30:00.520Z'
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

Meteor.publish('hostDesc', function(){
    var self = this;
    console.log('hostdesc');
    Meteor.call('qingcloud.getHostDesc', function(error, result){
        if (result){
            self.added("Host", Date.now(), result);
            self.ready();
        } else {
            self.ready();
        }
    });
});